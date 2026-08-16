import { jsonError } from './http'
import type { AdminEnv } from './env'

/**
 * GitHub API 封装 — Git Trees API 单 commit 提交。
 *
 * 为什么不用逐文件 Contents PUT：
 * - 单 commit = 单次 push = 只触发一次 Cloudflare Pages 构建，
 *   且避免「新 json + 旧图」的残缺中间态部署
 * - blob 新建不需要旧 sha，天然规避 Contents PUT 的更新 sha 问题
 */

const GITHUB_API = 'https://api.github.com'

export interface CommitEntry {
  path: string
  /** UTF-8 文本（如 space.json）或二进制的 base64 */
  content: string
  encoding: 'utf-8' | 'base64'
}

async function ghFetch(
  env: AdminEnv,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_PAT}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vbsite-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as Record<string, unknown> | null }
}

function githubError(step: string, status: number, body: Record<string, unknown> | null): Response {
  const message =
    (body?.message as string) ?? `GitHub API ${step} 失败（HTTP ${status}）`
  return jsonError('GITHUB_ERROR', `${step}: ${message}`, 502)
}

/** 读取 users/<userId>/space.json；404 返回 null */
export async function readSpace(
  env: AdminEnv,
  userId: string,
): Promise<{ content: string; sha: string } | null | Response> {
  const { status, body } = await ghFetch(
    env,
    `/repos/${env.GITHUB_REPO}/contents/users/${userId}/space.json?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`,
  )
  if (status === 404) return null
  if (status !== 200) return githubError('读取 space.json', status, body)

  const content = body?.content as string | undefined
  const sha = body?.sha as string | undefined
  if (typeof content !== 'string' || typeof sha !== 'string') {
    return githubError('解析 space.json', status, body)
  }
  // GitHub contents API 返回 base64（按行换行的变体）。
  // atob 产出 Latin-1 字符串（每字符一字节），必须显式按 UTF-8 解码——
  // 否则中文（多字节 UTF-8）会被拆成多个 Latin-1 字符（mojibake）。
  const binary = atob(content.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0))
  const text = new TextDecoder('utf-8').decode(bytes)
  return { content: text, sha }
}

/** 列出 users/ 目录下的客户 */
export async function listUserDirs(
  env: AdminEnv,
): Promise<string[] | Response> {
  const { status, body } = await ghFetch(
    env,
    `/repos/${env.GITHUB_REPO}/contents/users?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`,
  )
  if (status === 404) return []
  if (status !== 200) return githubError('列出用户目录', status, body)

  const entries = Array.isArray(body) ? (body as Record<string, unknown>[]) : []
  return entries.filter(e => e.type === 'dir').map(e => e.name as string)
}

/**
 * 将若干文件以单个 commit 提交到目标分支。
 * 流程：GET ref → GET commit(base tree) → POST blobs → POST trees → POST commits → PATCH ref
 */
export async function commitFiles(
  env: AdminEnv,
  entries: CommitEntry[],
  message: string,
): Promise<{ commitSha: string; htmlUrl: string } | Response> {
  const repo = env.GITHUB_REPO
  const branch = env.GITHUB_BRANCH

  // 1. 分支 head
  const ref = await ghFetch(env, `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`)
  if (ref.status !== 200) return githubError('读取分支', ref.status, ref.body)
  const headSha = (ref.body?.object as Record<string, unknown> | undefined)?.sha as string | undefined
  if (!headSha) return githubError('读取分支', ref.status, ref.body)

  // 2. base tree
  const headCommit = await ghFetch(env, `/repos/${repo}/git/commits/${headSha}`)
  if (headCommit.status !== 200) return githubError('读取 head commit', headCommit.status, headCommit.body)
  const baseTree = headCommit.body?.tree as Record<string, unknown> | undefined
  const baseTreeSha = typeof baseTree?.sha === 'string' ? baseTree.sha : undefined
  if (!baseTreeSha) return githubError('读取 base tree', headCommit.status, headCommit.body)

  // 3. blobs（并行）
  const blobResults = await Promise.all(
    entries.map(async entry => {
      const { status, body } = await ghFetch(env, `/repos/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: entry.content, encoding: entry.encoding }),
      })
      return { entry, status, body, sha: body?.sha as string | undefined }
    }),
  )
  const tree: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = []
  for (const result of blobResults) {
    if (result.status !== 201 || !result.sha) {
      return githubError(`创建 blob（${result.entry.path}）`, result.status, result.body)
    }
    tree.push({ path: result.entry.path, mode: '100644', type: 'blob', sha: result.sha })
  }

  // 4. tree
  const newTree = await ghFetch(env, `/repos/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  })
  if (newTree.status !== 201) return githubError('创建 tree', newTree.status, newTree.body)
  const newTreeSha = newTree.body?.sha as string | undefined
  if (!newTreeSha) return githubError('创建 tree', newTree.status, newTree.body)

  // 5. commit
  const newCommit = await ghFetch(env, `/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTreeSha, parents: [headSha] }),
  })
  if (newCommit.status !== 201) return githubError('创建 commit', newCommit.status, newCommit.body)
  const commitSha = newCommit.body?.sha as string | undefined
  if (!commitSha) return githubError('创建 commit', newCommit.status, newCommit.body)

  // 6. 前移分支引用
  const push = await ghFetch(env, `/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commitSha }),
  })
  if (push.status !== 200) return githubError('更新分支', push.status, push.body)

  return { commitSha, htmlUrl: `https://github.com/${repo}/commit/${commitSha}` }
}
