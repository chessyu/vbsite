import { useState } from 'react'
import { useEditor } from '../state/useEditor'
import { formRegistry, blockTypeLabels, blockTypeIcons } from './forms'
import type { BlockType } from '@/lib/spaceSchema'
import { getRegisteredBlockTypes } from '@/blocks/registry'

/**
 * 页面结构 + block 树 + 选中 block 的编辑表单。
 * 选中状态（pageId + blockIdx）由父级 AdminEditPage 持有。
 * 列表项支持原生 HTML5 拖拽排序（不引库）。
 */
export function PageStructureForm({ pageId, blockIdx, onSelect }: {
  pageId: string
  blockIdx: number
  onSelect: (blockIdx: number) => void
}) {
  const { state, dispatch } = useEditor()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  if (!state) return null
  const pageIdx = state.draft.pages.findIndex(p => p.id === pageId)
  const page = state.draft.pages[pageIdx]
  if (!page) return null

  const selected = page.blocks[blockIdx]
  const SelectedForm = selected ? formRegistry[selected.type as BlockType] : null

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDropTarget(null)
      return
    }
    const blocks = [...page.blocks]
    const [moved] = blocks.splice(dragIndex, 1)
    blocks.splice(targetIndex, 0, moved)
    dispatch({ type: 'REORDER_BLOCKS', pageIdx, blocks })
    // 修正选中索引跟随移动的 block
    onSelect(dragIndex === blockIdx ? targetIndex : blockIdx)
    setDragIndex(null)
    setDropTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* block 列表 */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-stone-600">页面区块（{page.blocks.length}）</span>
          <label className="relative">
            <select
              className="rounded-md border border-stone-300 bg-white px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-50"
              value=""
              onChange={e => {
                if (e.target.value) {
                  dispatch({ type: 'ADD_BLOCK', pageIdx, blockType: e.target.value as BlockType })
                  onSelect(page.blocks.length) // 新增在末尾，自动选中
                  e.target.value = ''
                }
              }}
            >
              <option value="">+ 添加区块…</option>
              {getRegisteredBlockTypes().map(type => (
                <option key={type} value={type}>
                  {blockTypeIcons[type as BlockType]} {blockTypeLabels[type as BlockType] ?? type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-1">
          {page.blocks.map((block, i) => {
            const isSelected = i === blockIdx
            const isDragging = i === dragIndex
            const isDropBefore = dropTarget === i
            return (
              <div key={i}>
                {/* 拖拽落点指示线 */}
                {isDropBefore && <div className="mx-1 mb-0.5 h-0.5 rounded-full bg-stone-800" />}
                <div
                  draggable
                  onDragStart={e => {
                    setDragIndex(i)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={e => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (dropTarget !== i) setDropTarget(i)
                  }}
                  onDragLeave={() => setDropTarget(t => (t === i ? null : t))}
                  onDrop={e => {
                    e.preventDefault()
                    handleDrop(i)
                  }}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setDropTarget(null)
                  }}
                  onClick={() => onSelect(i)}
                  className={`group relative flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
                    isSelected
                      ? 'border-stone-800 bg-stone-800/[0.06] font-medium text-stone-900 shadow-sm'
                      : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-400 hover:bg-white'
                  } ${isDragging ? 'opacity-40' : ''}`}
                >
                  {/* 选中态左竖条 */}
                  <span
                    aria-hidden
                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full transition-opacity ${
                      isSelected ? 'bg-stone-800 opacity-100' : 'opacity-0'
                    }`}
                  />
                  {/* 拖拽把手 + 图标 */}
                  <span className="cursor-grab select-none text-stone-300 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>⠿</span>
                  <span aria-hidden>{blockTypeIcons[block.type as BlockType] ?? '▫️'}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {blockTypeLabels[block.type as BlockType] ?? block.type}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5" onClick={e => e.stopPropagation()}>
                    <MiniBtn title="上移" disabled={i === 0} onClick={() => dispatch({ type: 'MOVE_BLOCK', pageIdx, blockIdx: i, dir: -1 })}>↑</MiniBtn>
                    <MiniBtn title="下移" disabled={i === page.blocks.length - 1} onClick={() => dispatch({ type: 'MOVE_BLOCK', pageIdx, blockIdx: i, dir: 1 })}>↓</MiniBtn>
                    <MiniBtn title="删除" danger onClick={() => {
                      if (confirm('确定删除该区块？')) {
                        dispatch({ type: 'REMOVE_BLOCK', pageIdx, blockIdx: i })
                        onSelect(-1)
                      }
                    }}>✕</MiniBtn>
                  </div>
                </div>
              </div>
            )
          })}
          {/* 末尾落点指示线 */}
          {dropTarget === page.blocks.length && (
            <div className="mx-1 h-0.5 rounded-full bg-stone-800" />
          )}
          {dragIndex !== null && (
            <div
              className="h-6"
              onDragOver={e => {
                e.preventDefault()
                setDropTarget(page.blocks.length)
              }}
              onDrop={e => {
                e.preventDefault()
                handleDrop(page.blocks.length)
              }}
            />
          )}
        </div>
      </div>

      {/* 选中 block 的表单 */}
      {selected && SelectedForm && (
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="mb-3 flex items-center gap-1.5 border-b border-stone-100 pb-2 text-xs font-semibold text-stone-700">
            <span aria-hidden>{blockTypeIcons[selected.type as BlockType] ?? '▫️'}</span>
            编辑：{blockTypeLabels[selected.type as BlockType] ?? selected.type}
          </div>
          <SelectedForm
            data={selected.data as Record<string, unknown>}
            userId={state.userId}
            token={state.userId ? new URLSearchParams(window.location.search).get('token') ?? '' : ''}
            onChange={updater => dispatch({
              type: 'UPDATE_BLOCK_DATA',
              pageIdx,
              blockIdx,
              updater,
            })}
          />
        </div>
      )}
    </div>
  )
}

function MiniBtn({ title, children, onClick, disabled, danger }: {
  title: string
  children: React.ReactNode
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
        danger ? 'text-red-500 hover:bg-red-50' : 'text-stone-400 hover:bg-stone-200 hover:text-stone-600'
      }`}
    >
      {children}
    </button>
  )
}
