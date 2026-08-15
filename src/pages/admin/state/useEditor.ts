import { useContext } from 'react'
import { EditorContext } from './editorContextTypes'

/** 编辑器状态 hook — 必须在 EditorProvider 内使用 */
export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) throw new Error('useEditor 必须在 EditorProvider 内使用')
  return context
}

/** 丢弃本地草稿（重置用） */
export function clearDraft(userId: string) {
  localStorage.removeItem(`vbsite:admin:draft:${userId}`)
}
