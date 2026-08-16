import { useState } from 'react'
import type { ReactNode } from 'react'

/**
 * 数组字段通用编辑器 — 增删排序（上移/下移），条目内容由 renderItem 决定。
 * experiences / projects / skills / services / socials / cta / 字幕带 全部复用。
 *
 * collapsible 模式：提供 itemSummary 时条目默认折叠为单行摘要，
 * 点击展开编辑（同屏仅一条展开）——用于字段多、条目多的场景（如字幕带）。
 */
export function ListEditor<T>({ label, items, onChange, createItem, renderItem, addLabel, itemTitle, itemSummary, renderSummaryExtra }: {
  label: string
  items: T[]
  onChange: (items: T[]) => void
  createItem: () => T
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode
  addLabel?: string
  /** 折叠头标题（非 collapsible 模式的条目标题） */
  itemTitle?: (item: T, index: number) => string
  /** 提供即启用 collapsible 模式：折叠态单行摘要 */
  itemSummary?: (item: T, index: number) => string
  /** 摘要行右侧的附加徽标（如 vh 配速），返回 null 不渲染 */
  renderSummaryExtra?: (item: T, index: number) => ReactNode
}) {
  const collapsible = !!itemSummary
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function updateAt(index: number, patch: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    // 展开态跟随移动的条目
    if (expandedIdx === index) setExpandedIdx(target)
    else if (expandedIdx === target) setExpandedIdx(index)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-stone-600">{label}</span>
        <button
          type="button"
          onClick={() => {
            onChange([...items, createItem()])
            if (collapsible) setExpandedIdx(items.length) // 新增自动展开
          }}
          className="rounded-md border border-stone-300 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-50 transition-colors"
        >
          + {addLabel ?? '新增'}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          if (collapsible) {
            return (
              <div key={index} className="rounded-lg border border-stone-200 bg-stone-50/60">
                {/* 折叠态摘要行 */}
                <div
                  className="flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5"
                  onClick={() => setExpandedIdx(expandedIdx === index ? null : index)}
                >
                  <span className="text-[10px] text-stone-400 transition-transform" aria-hidden>
                    {expandedIdx === index ? '▾' : '▸'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-stone-700">
                    {itemSummary!(item, index)}
                  </span>
                  {renderSummaryExtra?.(item, index)}
                  <div className="flex shrink-0 items-center gap-0.5" onClick={e => e.stopPropagation()}>
                    <IconBtn title="上移" disabled={index === 0} onClick={() => move(index, -1)}>↑</IconBtn>
                    <IconBtn title="下移" disabled={index === items.length - 1} onClick={() => move(index, 1)}>↓</IconBtn>
                    <IconBtn
                      title="删除"
                      danger
                      onClick={() => {
                        onChange(items.filter((_, i) => i !== index))
                        if (expandedIdx === index) setExpandedIdx(null)
                        else if (expandedIdx !== null && expandedIdx > index) setExpandedIdx(expandedIdx - 1)
                      }}
                    >
                      ✕
                    </IconBtn>
                  </div>
                </div>
                {/* 展开态编辑区 */}
                {expandedIdx === index && (
                  <div className="border-t border-stone-200 p-2.5">
                    <div className="space-y-2">{renderItem(item, patch => updateAt(index, patch))}</div>
                  </div>
                )}
              </div>
            )
          }
          return (
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
          )
        })}
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
