import { useRef, useState } from 'react'
import { spaceApi, ApiError } from '@/lib/admin/api'
import type { AiPatch } from '@/lib/admin/api'
import { useEditor } from '../state/useEditor'
import { blockTypeLabels } from './forms'
import type { BlockType } from '@/lib/spaceSchema'

/**
 * AI 导入 — 上传文档（md/txt/pdf），后端调 LLM 提取关键信息并分配到当前页区块。
 * 结果先预览，用户确认后逐块整包替换 data（UPDATE_BLOCK_DATA）。
 * pdf 由前端 pdfjs 抽取文本（lazy import，不进主 bundle）。
 */
export function AIImportPanel({ pageId }: { pageId: string }) {
  const { state, dispatch } = useEditor()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ patches: AiPatch[]; notes: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)

  if (!state) return null
  const pageIdx = state.draft.pages.findIndex(p => p.id === pageId)
  const page = state.draft.pages[pageIdx]
  if (!page) return null

  async function extractText(file: File): Promise<string> {
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      return file.text()
    }
    // pdf：前端抽取文本后以纯文本提交（Workers 端无轻量 pdf 解析）
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const parts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const pdfPage = await doc.getPage(i)
      const content = await pdfPage.getTextContent()
      parts.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '))
    }
    return parts.join('\n')
  }

  async function handleAnalyze() {
    if (!file) return
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      const text = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
        ? await extractText(file)
        : ''
      const { patches, notes } = await spaceApi.aiAnalyze(
        state!.userId,
        text
          ? { text, blocks: page.blocks.map(b => ({ type: b.type, data: b.data })) }
          : { file, blocks: page.blocks.map(b => ({ type: b.type, data: b.data })) },
        new URLSearchParams(window.location.search).get('token') ?? '',
      )
      if (patches.length === 0) {
        setError('AI 未找到可填充的内容，请检查文档或手动编辑。')
      }
      setResult({ patches, notes })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '分析失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  function handleApply() {
    if (!result || !confirm(`将用 AI 结果覆盖 ${result.patches.length} 个区块的内容？（应用后仍可撤销/手动修改）`)) return
    for (const p of result.patches) {
      dispatch({ type: 'UPDATE_BLOCK_DATA', pageIdx, blockIdx: p.index, updater: () => p.data })
    }
    setResult(null)
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold text-stone-700">🤖 AI 导入（{page.title || page.id}）</div>
      <p className="mb-2 text-[11px] leading-relaxed text-stone-400">
        上传简历/介绍文档（md / txt / pdf），AI 提取关键信息并填充到当前页的区块。
      </p>

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt,.markdown,.pdf,text/plain,text/markdown,application/pdf"
          disabled={busy}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="min-w-0 flex-1 text-[11px] text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-stone-100 file:px-2 file:py-1 file:text-[11px] file:text-stone-600 hover:file:bg-stone-200"
        />
        <button
          type="button"
          disabled={busy || !file}
          onClick={handleAnalyze}
          className="shrink-0 rounded-lg bg-stone-800 px-3 py-1.5 text-[11px] text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {busy ? '分析中…' : '分析'}
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-3 space-y-2 border-t border-stone-100 pt-2">
          {result.notes && (
            <p className="text-[11px] leading-relaxed text-stone-500">📝 {result.notes}</p>
          )}
          <ul className="space-y-1">
            {result.patches.map(p => (
              <li key={p.index} className="flex items-center gap-1.5 text-[11px] text-stone-600">
                <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">
                  #{p.index}
                </span>
                {blockTypeLabels[p.type as BlockType] ?? p.type}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] text-white hover:bg-emerald-500 transition-colors"
            >
              应用到 {result.patches.length} 个区块
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); if (fileRef.current) fileRef.current.value = '' }}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-[11px] text-stone-600 hover:bg-stone-50 transition-colors"
            >
              放弃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
