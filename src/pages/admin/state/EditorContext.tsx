import { useMemo, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import { editorReducer } from './editorReducer'
import { EditorContext } from './editorContextTypes'
import type { SpaceConfig } from '@/lib/spaceSchema'

/**
 * 编辑器 Provider — 草稿持久化到 localStorage（key 含 userId，防止串户），
 * 「重置为线上版本」通过 clearDraft（useEditor.ts）丢弃草稿。
 */

/**
 * 剥离会话级预览字段（blob URL 只在创建它的会话内有效）。
 * 草稿持久化/恢复前调用：跨会话恢复的 blob URL 必然失效，
 * 会让 VideoHero 优先取 stale previewUrl 而渲染失败；剥离后走远端路径
 * （dev 中间件本地优先/GitHub raw 兜底），与 publish 端点的剥离逻辑双保险。
 */
function stripSessionPreviewFields(config: SpaceConfig): SpaceConfig {
  // 纯函数：克隆后剥离，不得改动传入的 draft（内存中的 previewUrl 供同会话即时预览）
  const cloned = JSON.parse(JSON.stringify(config)) as SpaceConfig
  for (const page of cloned.pages) {
    for (const block of page.blocks) {
      const data = block.data as Record<string, unknown> | undefined
      if (!data) continue
      const video = data.video as Record<string, unknown> | undefined
      if (video && 'previewUrl' in video) delete video.previewUrl
      if ('posterPreviewUrl' in data) delete data.posterPreviewUrl
    }
  }
  return cloned
}

/**
 * 旧目录结构迁移：users/<id>/images|videos|upload → users/<id>/assets
 * （提交 952f56e 统一为 assets/）。历史 localStorage 草稿仍存旧路径，
 * 远端文件已全部迁移，不迁移的话编辑器恢复草稿后所有资源 404。
 * 深度遍历所有字符串值做前缀替换。
 */
function migrateLegacyAssetPaths(config: SpaceConfig, userId: string): SpaceConfig {
  let changed = false
  const visit = (node: unknown): unknown => {
    if (typeof node === 'string') {
      const next = node.replace(
        new RegExp(`^/users/${userId}/(images|videos|upload)/`),
        `/users/${userId}/assets/`,
      )
      if (next !== node) changed = true
      return next
    }
    if (Array.isArray(node)) return node.map(visit)
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(node)) out[k] = visit(v)
      return out
    }
    return node
  }
  const migrated = visit(config) as SpaceConfig
  if (changed) console.info('[vbsite:admin] 草稿含旧资源路径（images/videos → assets），已自动迁移')
  return migrated
}

function storageKey(userId: string) {
  return `vbsite:admin:draft:${userId}`
}

/**
 * 脏 socials 修复：早期 AI 导入契约误写 { label, href }（正确是 { icon, title, url?, bg? }），
 * 导致部分草稿里 socials 缺 icon/title，发布严格校验失败。
 * 草稿恢复时做别名映射 + 默认值，历史脏数据自动修复。
 */
function repairSocials(config: SpaceConfig): SpaceConfig {
  let changed = false
  const cloned = JSON.parse(JSON.stringify(config)) as SpaceConfig
  for (const page of cloned.pages) {
    for (const block of page.blocks) {
      if (block.type !== 'contact') continue
      const data = block.data as Record<string, unknown>
      if (!Array.isArray(data.socials)) continue
      data.socials = data.socials
        .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
        .map(s => {
          const icon = typeof s.icon === 'string' && s.icon ? s.icon : '🔗'
          const title =
            typeof s.title === 'string' && s.title
              ? s.title
              : typeof s.label === 'string' && s.label
                ? s.label
                : typeof s.name === 'string' && s.name
                  ? s.name
                  : '联系方式'
          const url =
            typeof s.url === 'string' && s.url
              ? s.url
              : typeof s.href === 'string' && s.href
                ? s.href
                : '#'
          const bg = typeof s.bg === 'string' && s.bg ? s.bg : 'bg-stone-500'
          if (icon !== s.icon || title !== s.title) changed = true
          return { icon, title, url, bg }
        })
    }
  }
  if (changed) console.info('[vbsite:admin] 草稿 socials 字段异常（AI 导入历史数据），已自动修复')
  return cloned
}

/**
 * 检测 UTF-8 被 Latin-1 二次编码的污染特征（mojibake）。
 * 真实中文文案几乎不会高频出现这些字符序列；出现即说明草稿在某个坏缓存时期
 * 被错误解码后存了下来（如 "用 ❤️ 打造" 变成 "ç¨ â¤ï¸ æå»"）。
 */
function looksMojibake(raw: string): boolean {
  const patterns = [/[ÂÃ¢][\x80-\xBF]/g, /æ[\x80-\xBF]/g, /ç[\x80-\x9F]/g]
  let hits = 0
  for (const re of patterns) {
    hits += (raw.match(re) ?? []).length
  }
  // 草稿里含中文时才判断（纯英文配置误检率极高，跳过）
  const hasCJK = /[一-鿿]/.test(raw)
  return hasCJK ? hits >= 3 : hits >= 8
}

export function EditorProvider({ userId, initialConfig, children }: {
  userId: string
  initialConfig: SpaceConfig
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(editorReducer, null, () => {
    // 恢复本地草稿（如有且结构兼容），否则用线上配置起步
    try {
      const raw = localStorage.getItem(storageKey(userId))
      if (raw) {
        // 编码污染防护：坏缓存时期存下的 mojibake 草稿自动丢弃，回到线上干净版本
        if (looksMojibake(raw)) {
          console.warn('[vbsite:admin] 检测到草稿编码异常，已丢弃并恢复为线上版本')
          localStorage.removeItem(storageKey(userId))
        } else {
          const draft = repairSocials(migrateLegacyAssetPaths(
            stripSessionPreviewFields(JSON.parse(raw) as SpaceConfig),
            userId,
          ))
          if (draft?.pages?.length && draft.space) {
            const base = editorReducer(null, { type: 'INIT', userId, config: initialConfig })!
            return { ...base, draft }
          }
        }
      }
    } catch {
      // 草稿损坏则忽略
    }
    return editorReducer(null, { type: 'INIT', userId, config: initialConfig })
  })

  // 草稿持久化
  useEffect(() => {
    if (!state) return
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(stripSessionPreviewFields(state.draft)))
    } catch {
      // 存储满等场景静默失败
    }
  }, [state, userId])

  const dirty = useMemo(
    () => !!state && JSON.stringify(state.draft) !== JSON.stringify(state.saved),
    [state],
  )

  return (
    <EditorContext.Provider value={{ state, dispatch, dirty }}>
      {children}
    </EditorContext.Provider>
  )
}
