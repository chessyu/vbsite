/** 表单原子控件 — 所有 block 表单复用。统一 stone 色系紧凑风格。 */

export function Field({ label, hint, children }: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-stone-400">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-stone-600 focus:border-stone-600 transition'

export function TextField({ label, hint, value, onChange, placeholder }: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  )
}

export function TextAreaField({ label, hint, value, onChange, rows = 3, placeholder }: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={inputClass + ' resize-y'}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  )
}

export function ColorField({ label, hint, value, onChange, placeholder }: {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          type="color"
          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-stone-300 bg-white p-0.5"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#78716c'}
          onChange={e => onChange(e.target.value)}
          aria-label={`${label} 取色器`}
        />
        <input
          type="text"
          className={inputClass}
          value={value}
          placeholder={placeholder ?? '#78716c 或 CSS 值'}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </Field>
  )
}

export function SwitchField({ label, value, onChange }: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-xs font-medium text-stone-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-stone-800' : 'bg-stone-300'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`}
        />
      </button>
    </label>
  )
}

export function NumberField({ label, hint, value, onChange, min = 0, max = 100, step = 1 }: {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          className="flex-1 accent-stone-700"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span className="w-10 shrink-0 text-right text-sm tabular-nums text-stone-600">{value}</span>
      </div>
    </Field>
  )
}
