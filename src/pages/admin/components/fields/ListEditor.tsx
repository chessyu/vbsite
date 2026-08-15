import type { ReactNode } from 'react'

/**
 * 数组字段通用编辑器 — 增删排序（上移/下移），条目内容由 render Item 决定。
 * experiences / projects / skills / services / socials / cta 全部复用。
 */
export function ListEditor<T>({ label, items, onChange, createItem, renderItem, addLabel, itemTitle }: {
  label: string
  items: T[]
  onChange: (items: T[]) => void
  createItem: () => T
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode
  addLabel?: string
  /** 条目标题（展示在折叠头） */
  itemTitle?: (item: T, index: number) => string
}) {
  function updateAt(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-stone-600">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, createItem()])}
          className="rounded-md border border-stone-300 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-50 transition-colors"
        >
          + {addLabel ?? '新增'}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-stone-200 bg-stone-50/60 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-medium text-stone-500">
                {itemTitle?.(item, index) ?? `#${index + 1}`}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <IconBtn title="上移" disabled={index === 0} onClick={() => move(index, -1)}>↑</IconBtn>
                <IconBtn title="下移" disabled={index === items.length - 1} onClick={() => move(index, 1)}>↓</IconBtn>
                <IconBtn
                  title="删除"
                  danger
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  ✕
                </IconBtn>
              </div>
            </div>
            <div className="space-y-2">{renderItem(item, patch => updateAt(index, patch))}</div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-300 px-3 py-4 text-center text-[11px] text-stone-400">
            暂无条目
          </p>
        )}
      </div>
    </div>
  )
}

function IconBtn({ title, children, onClick, disabled, danger }: {
  title: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-5 w-5 items-center justify-center rounded text-[11px] transition-colors disabled:opacity-30 ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-stone-500 hover:bg-stone-200'
      }`}
    >
      {children}
    </button>
  )
}
