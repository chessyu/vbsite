import { useRef, useState } from 'react'
import { Field } from './TextField'

/**
 * 图片上传控件 — 上传到 /api/space/:userId/assets 后回填绝对路径。
 * 编辑会话内用 data URL 预览（新上传的图本地/远端都还没就绪），config 中存绝对路径。
 */
export function ImageField({ label, hint, userId, token, value, onChange }: {
  label: string
  hint?: string
  userId: string
  token: string
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 会话内预览：新上传用 dataUrl，已有路径直接展示 */
  const [sessionPreview, setSessionPreview] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const { spaceApi } = await import('@/lib/admin/api')
      const { files } = await spaceApi.uploadAssets(userId, [file], token)
      onChange(files[0].path)
      setSessionPreview(files[0].dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const previewSrc = sessionPreview ?? (/^(https?:)?\/|data:/.test(value) ? value : null)

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-3">
        <div
          className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 text-stone-300 hover:border-stone-500 transition-colors"
          onClick={() => inputRef.current?.click()}
          role="button"
          aria-label="上传图片"
        >
          {previewSrc ? (
            <img src={previewSrc} alt="预览" className="h-full w-full object-cover" />
          ) : uploading ? (
            <span className="text-[10px] text-stone-400">上传中…</span>
          ) : (
            <span className="text-xl">＋</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-stone-300 px-2.5 py-1 text-[11px] text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              {uploading ? '上传中…' : '上传图片'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  if (confirmClear) {
                    onChange('')
                    setSessionPreview(null)
                    setConfirmClear(false)
                  } else {
                    setConfirmClear(true)
                    setTimeout(() => setConfirmClear(false), 3000)
                  }
                }}
                className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] text-red-500 hover:bg-red-50 transition-colors"
              >
                {confirmClear ? '确认清除？' : '清除'}
              </button>
            )}
          </div>
          {value && (
            <p className="mt-1.5 truncate text-[10px] text-stone-400" title={value}>{value}</p>
          )}
          {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
        </div>
      </div>
    </Field>
  )
}
