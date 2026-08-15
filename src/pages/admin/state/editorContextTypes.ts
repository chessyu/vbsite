import { createContext } from 'react'
import type { Dispatch } from 'react'
import type { EditorState, EditorAction } from './editorReducer'

/** Context 对象独立文件（react-refresh 要求组件文件只导出组件） */
export const EditorContext = createContext<{
  state: EditorState | null
  dispatch: Dispatch<EditorAction>
  /** 是否有未发布修改 */
  dirty: boolean
} | null>(null)
