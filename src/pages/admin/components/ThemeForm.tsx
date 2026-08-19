import { themePresets, matchPreset } from '@/lib/themePresets'
import { useEditor } from '../state/useEditor'

/**
 * 主题选择 — 预设套系直接点选（不做自定义表单）。
 * 点击整包覆盖 theme；当前配置与任何预设不一致时提示「自定义」并要求确认覆盖。
 */
export function ThemeForm() {
  const { state, dispatch } = useEditor()
  if (!state) return null
  const { theme } = state.draft
  const activePreset = matchPreset(theme)

  return (
    <div className="space-y-3">
      {!activePreset && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          当前为自定义主题（或旧配置），选择预设将整包覆盖。
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {themePresets.map(preset => {
          const isActive = activePreset?.id === preset.id
          const bg = preset.theme.background
          const bgStyle = bg.startsWith('#') || bg.startsWith('linear-gradient')
            ? { background: bg }
            : undefined
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                if (!isActive && !confirm(`切换到「${preset.name}」主题？将覆盖当前主题配置。`)) return
                dispatch({ type: 'SET_THEME', patch: { ...preset.theme } })
              }}
              className={`rounded-xl border p-2 text-left transition-all ${
                isActive
                  ? 'border-stone-800 bg-stone-800/[0.06] shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-400'
              }`}
            >
              {/* 背景预览条（CSS 值直接渲染） */}
              <div
                className="mb-1.5 h-10 w-full rounded-lg border border-black/5"
                style={bgStyle}
              >
                <div className="flex h-full items-center justify-center gap-1 px-1.5">
                  {preset.swatch.slice(1, 3).map(c => (
                    <span
                      key={c}
                      className="h-2.5 w-2.5 rounded-full border border-black/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isActive ? 'font-semibold text-stone-900' : 'text-stone-700'}`}>
                  {preset.name}
                </span>
                <span className="text-[10px] text-stone-400" aria-hidden>
                  {preset.theme.mode === 'light' ? '☀️' : '🌙'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-stone-400">
        共 {themePresets.length} 套预设（{themePresets.filter(p => p.theme.mode === 'light').length} 亮 /{' '}
        {themePresets.filter(p => p.theme.mode === 'dark').length} 暗），选中后预览即时生效。
      </p>
    </div>
  )
}
