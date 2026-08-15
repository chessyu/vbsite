import { useMemo, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import { editorReducer } from './editorReducer'
import { EditorContext } from './editorContextTypes'
import type { SpaceConfig } from '@/lib/spaceSchema'

/**
 * 编辑器 Provider — 草稿持久化到 localStorage（key 含 userId，防止串户），
 * 「重置为线上版本」通过 clearDraft（useEditor.ts）丢弃草稿。
 */

function storageKey(userId: string) {
  return `vbsite:admin:draft:${userId}`
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
          const draft = JSON.parse(raw) as SpaceConfig
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
      localStorage.setItem(storageKey(userId), JSON.stringify(state.draft))
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
