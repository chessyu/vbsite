#!/usr/bin/env node
/**
 * 一次性迁移：public/users/<id>/images|videos/** → users/<id>/assets/，
 * 并把所有 users/<id>/space.json 中的资源路径引用同步替换。
 *
 * 背景：assets 曾 commit 到 public/users/<id>/{images,videos}/，与 space.json
 * 所在的 users/<id>/ 割裂（Vite 只把 public/ 拷进 dist，users/ 根目录进不了
 * 构建产物；dev 下两处数据源也不一致）。统一为 users/<id>/assets/ 后，
 * users/<id>/ 成为唯一数据目录。
 *
 * 用法：
 *   node --env-file=.env scripts/migrate-assets.mjs --dry-run   # 只打印计划
 *   node --env-file=.env scripts/migrate-assets.mjs             # 执行迁移（写远端 main）
 *
 * 实现与 functions/_lib/github.ts 同模式：Git Trees API 单 commit 原子完成
 * （blob 搬迁 + 旧路径删除 + space.json 改写一次 push，只触发一次 Pages 构建）。
 * 幂等：目标路径已存在则跳过；无旧资产则不做任何事。
 */

const GITHUB_API = 'https://api.github.com'
const REPO = process.env.GITHUB_REPO
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const PAT = process.env.GITHUB_PAT
const DRY_RUN = process.argv.includes('--dry-run')

if (!REPO || !PAT) {
  console.error('❌ 缺少 GITHUB_REPO / GITHUB_PAT 环境变量（用 node --env-file=.env 运行）')
  process.exit(1)
}

async function gh(path, init = {}) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vbsite-migrate',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

/** 递归列出某路径下全部文件（Git Trees API，recursive=1） */
async function listTree(treeSha) {
  const { status, body } = await gh(`/repos/${REPO}/git/trees/${treeSha}?recursive=1`)
  if (status !== 200) throw new Error(`列出 tree 失败: HTTP ${status}`)
  return body.tree.filter(t => t.type === 'blob')
}

/** base64（含换行变体）→ UTF-8 文本，与 readSpace 同款解码 */
function b64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

async function main() {
  // 1. 分支 head → 递归 tree
  const ref = await gh(`/repos/${REPO}/git/ref/heads/${encodeURIComponent(BRANCH)}`)
  if (ref.status !== 200) throw new Error(`读取分支失败: HTTP ${ref.status}`)
  const headSha = ref.body.object.sha
  const headCommit = await gh(`/repos/${REPO}/git/commits/${headSha}`)
  const baseTreeSha = headCommit.body.tree.sha

  const allFiles = await listTree(baseTreeSha)

  // 2. 找出旧资产与 space.json
  const oldAssets = allFiles.filter(t => /^public\/users\/[^/]+\/(images|videos)\//.test(t.path))
  const spaceJsons = allFiles.filter(t => /^users\/[^/]+\/space\.json$/.test(t.path))

  const moves = [] // { from, to }
  for (const asset of oldAssets) {
    // public/users/<id>/images|videos/<name> → users/<id>/assets/<name>
    const m = asset.path.match(/^public\/users\/([^/]+)\/(?:images|videos)\/(.+)$/)
    if (!m) continue
    moves.push({ from: asset.path, to: `users/${m[1]}/assets/${m[2]}` })
  }

  console.log(`发现旧资产 ${moves.length} 个、space.json ${spaceJsons.length} 个`)
  if (moves.length === 0 && spaceJsons.length === 0) {
    console.log('✅ 无需迁移')
    return
  }

  // 3. 拉取 space.json 内容，做路径替换
  const spaceEdits = [] // { path, content }
  for (const sj of spaceJsons) {
    const { status, body } = await gh(`/repos/${REPO}/contents/${sj.path}?ref=${encodeURIComponent(BRANCH)}`)
    if (status !== 200) continue
    const text = b64ToUtf8(body.content)
    // /users/<id>/images/xxx 或 /users/<id>/videos/xxx → /users/<id>/assets/xxx
    const userId = sj.path.match(/^users\/([^/]+)\//)[1]
    const replaced = text
      .replaceAll(`/users/${userId}/images/`, `/users/${userId}/assets/`)
      .replaceAll(`/users/${userId}/videos/`, `/users/${userId}/assets/`)
    if (replaced !== text) spaceEdits.push({ path: sj.path, content: replaced })
  }

  // 4. 计划输出
  console.log('\n搬迁文件：')
  moves.forEach(m => console.log(`  ${m.from} → ${m.to}`))
  console.log(`\n改写 space.json：${spaceEdits.length} 个`)
  spaceEdits.forEach(e => console.log(`  ${e.path}`))
  const deletions = moves.map(m => ({ path: m.from, sha: null }))
  console.log(`\n删除旧路径：${deletions.length} 个（搬迁即删除原位置）`)

  if (DRY_RUN) {
    console.log('\n[dry-run] 未执行。去掉 --dry-run 真正提交。')
    return
  }

  // 5. 单 commit：blob 搬迁（复用原 blob sha，零拷贝）+ space.json 改写 + 旧路径删除
  const tree = []
  for (const m of moves) {
    const orig = oldAssets.find(a => a.path === m.from)
    tree.push({ path: m.to, mode: '100644', type: 'blob', sha: orig.sha })
  }
  for (const e of spaceEdits) {
    const blob = await gh(`/repos/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: e.content, encoding: 'utf-8' }),
    })
    if (blob.status !== 201) throw new Error(`创建 blob 失败（${e.path}）: HTTP ${blob.status}`)
    tree.push({ path: e.path, mode: '100644', type: 'blob', sha: blob.body.sha })
  }
  for (const d of deletions) tree.push({ path: d.path, mode: '100644', type: 'blob', sha: null })

  const newTree = await gh(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  })
  if (newTree.status !== 201) throw new Error(`创建 tree 失败: HTTP ${newTree.status}`)

  const newCommit = await gh(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'chore(migrate): 资产目录统一为 users/<id>/assets/，space.json 路径同步替换',
      tree: newTree.body.sha,
      parents: [headSha],
    }),
  })
  if (newCommit.status !== 201) throw new Error(`创建 commit 失败: HTTP ${newCommit.status}`)

  const push = await gh(`/repos/${REPO}/git/refs/heads/${encodeURIComponent(BRANCH)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.body.sha }),
  })
  if (push.status !== 200) throw new Error(`更新分支失败: HTTP ${push.status}`)

  console.log(`\n✅ 迁移完成：https://github.com/${REPO}/commit/${newCommit.body.sha}`)
}

main().catch(err => {
  console.error(`❌ ${err.message}`)
  process.exit(1)
})
