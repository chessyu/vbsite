import { useEditor } from '../state/useEditor'
import { formRegistry, blockTypeLabels } from './forms'
import type { BlockType } from '@/lib/spaceSchema'
import { getRegisteredBlockTypes } from '@/blocks/registry'

/**
 * 页面结构 + block 树 + 选中 block 的编辑表单。
 * 选中状态（pageId + blockIdx）由父级 AdminEditPage 持有。
 */
export function PageStructureForm({ pageId, blockIdx, onSelect }: {
  pageId: string
  blockIdx: number
  onSelect: (blockIdx: number) => void
}) {
  const { state, dispatch } = useEditor()
  if (!state) return null
  const pageIdx = state.draft.pages.findIndex(p => p.id === pageId)
  const page = state.draft.pages[pageIdx]
  if (!page) return null

  const selected = page.blocks[blockIdx]
  const SelectedForm = selected ? formRegistry[selected.type as BlockType] : null

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
                <option key={type} value={type}>{blockTypeLabels[type as BlockType] ?? type}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-1">
          {page.blocks.map((block, i) => (
            <div
              key={i}
              onClick={() => onSelect(i)}
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                i === blockIdx
                  ? 'border-stone-800 bg-white font-medium text-stone-800'
                  : 'border-stone-200 bg-white/60 text-stone-600 hover:border-stone-400'
              }`}
            >
              <span className="truncate">
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
          ))}
        </div>
      </div>

      {/* 选中 block 的表单 */}
      {selected && SelectedForm && (
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="mb-3 border-b border-stone-100 pb-2 text-xs font-semibold text-stone-700">
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
