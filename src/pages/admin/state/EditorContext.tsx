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
        const draft = JSON.parse(raw) as SpaceConfig
        if (draft?.pages?.length && draft.space) {
          const base = editorReducer(null, { type: 'INIT', userId, config: initialConfig })!
          return { ...base, draft }
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
