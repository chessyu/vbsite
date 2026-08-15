import { TextField } from './fields'
import { useEditor } from '../state/useEditor'

/** 空间元信息（username 只读 — 与 URL/目录强绑定） */
export function SpaceMetaForm() {
  const { state, dispatch } = useEditor()
  if (!state) return null
  const { space } = state.draft

  return (
    <div className="space-y-3">
      <TextField label="用户 ID（URL 路径，不可改）" value={space.username} onChange={() => undefined}
        hint="由编辑链接决定，与部署目录绑定" />
      <TextField label="展示名" value={space.displayName} onChange={v => dispatch({ type: 'SET_SPACE_META', patch: { displayName: v } })} />
      <TextField label="页脚文字" value={space.footer ?? ''} onChange={v => dispatch({ type: 'SET_SPACE_META', patch: { footer: v || undefined } })} />
    </div>
  )
}
