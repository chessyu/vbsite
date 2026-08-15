import { TextField, ColorField } from './fields'
import { useEditor } from '../state/useEditor'

/** 主题风格编辑 */
export function ThemeForm() {
  const { state, dispatch } = useEditor()
  if (!state) return null
  const { theme } = state.draft
  const patch = (p: Partial<typeof theme>) => dispatch({ type: 'SET_THEME', patch: p })

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['light', 'dark'] as const).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => patch({ mode })}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
              theme.mode === mode
                ? 'border-stone-800 bg-stone-800 text-stone-50'
                : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {mode === 'light' ? '☀️ 浅色' : '🌙 深色'}
          </button>
        ))}
      </div>

      <TextField
        label="背景（CSS 值，支持渐变）"
        value={theme.background}
        onChange={v => patch({ background: v })}
        placeholder="linear-gradient(...) 或 #fafaf9"
      />
      <TextField label="主文字色（Tailwind 类）" value={theme.textColor} onChange={v => patch({ textColor: v })} placeholder="text-stone-900" />
      <TextField label="次级文字色（Tailwind 类）" value={theme.subTextColor} onChange={v => patch({ subTextColor: v })} placeholder="text-stone-600" />
      <TextField label="弱化文字色（Tailwind 类）" value={theme.mutedTextColor} onChange={v => patch({ mutedTextColor: v })} placeholder="text-stone-400" />
      <TextField label="主渐变（CSS gradient）" value={theme.primaryGradient} onChange={v => patch({ primaryGradient: v })} placeholder="linear-gradient(135deg, #f59e0b, #ec4899)" />
      <ColorField
        label="极光色（逗号分隔，可空）"
        value={theme.auroraColors?.[0] ?? ''}
        onChange={v => patch({ auroraColors: v ? [v] : undefined })}
        hint="仅 hero 启用 Aurora 时生效"
      />
    </div>
  )
}
