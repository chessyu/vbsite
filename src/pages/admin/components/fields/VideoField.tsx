import { useEffect, useRef, useState } from 'react'
import { Field } from './TextField'
import { transcodeForScrub } from '@/lib/admin/videoTranscode'
import { registerSessionAsset } from '../../state/sessionAssets'

export interface VideoFieldResult {
  /** 上传后的绝对路径（写入 space.json） */
  url: string
  /** 字节数（block 据此决定加载策略） */
  bytes: number
  /** 上传后的海报图路径 */
  posterUrl: string
  /** 会话内视频预览（本地 blob URL） */
  previewUrl: string
  /** 会话内海报预览（本地 blob URL） */
  posterPreviewUrl: string
}

type Phase =
  | { stage: 'idle' }
  | { stage: 'probing' }                           // 预检：探测时长/分辨率（超 30s 秒级拦截）
  | { stage: 'loading' }                           // 加载 ffmpeg wasm（仅首次）
  | { stage: 'transcoding'; progress: number }     // 转码 0–1
  | { stage: 'poster' }                            // 提取海报帧
  | { stage: 'uploading' }
  | { stage: 'done'; previewUrl: string | null }
  | { stage: 'error'; message: string }

const PHASE_LABEL: Record<Phase['stage'], string> = {
  idle: '',
  probing: '解析视频信息…',
  loading: '加载视频处理引擎…（首次约 30MB，之后有缓存）',
  transcoding: '转码中',
  poster: '提取海报帧…',
  uploading: '上传中…',
  done: '',
  error: '',
}

/**
 * 视频上传控件：上传前在浏览器内用 ffmpeg.wasm 转码（短关键帧 + ≤8MB，scroll-scrub 流畅的前提）
 * 并提取首帧海报，然后视频 + 海报一起上传，一次回填 video.url / bytes / posterUrl。
 */
export function VideoField({ label, hint, userId, token, value, onChange, posterValue }: {
  label: string
  hint?: string
  userId: string
  token: string
  value: string
  onChange: (result: VideoFieldResult) => void
  /** 已有海报路径（自动提取回填，也可在表单里手动替换） */
  posterValue: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ stage: 'idle' })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFile(file: File) {
    setPhase({ stage: 'loading' })
    try {
      // 1. 浏览器内转码 + 海报提取（scroll-scrub 的流畅性前提）
      const { video, poster } = await transcodeForScrub(file, p => {
        setPhase(p.stage === 'loading'
          ? { stage: 'loading' }
          : p.stage === 'poster'
            ? { stage: 'poster' }
            : p.stage === 'probing'
              ? { stage: 'probing' }
              : { stage: 'transcoding', progress: p.progress })
      })

      // 2. 视频 + 海报一起上传
      setPhase({ stage: 'uploading' })
      const { spaceApi } = await import('@/lib/admin/api')
      const { files } = await spaceApi.uploadAssets(userId, [video, poster], token)
      const videoUploaded = files.find(f => f.path.endsWith('.mp4'))
      const posterUploaded = files.find(f => f.path.endsWith('.png') || f.path.endsWith('.jpg'))

      // 3. 回填（会话内用本地 blob 预览，远端文件刚 commit 还未部署）
      const localPreview = URL.createObjectURL(video)
      const localPosterPreview = URL.createObjectURL(poster)
      // 远端路径登记会话映射（预览 iframe 渲染前替换为本地 blob，避免远端未部署 404）
      if (videoUploaded) registerSessionAsset(videoUploaded.path, localPreview)
      if (posterUploaded) registerSessionAsset(posterUploaded.path, localPosterPreview)
      onChange({
        url: videoUploaded?.path ?? '',
        bytes: videoUploaded?.bytes ?? video.size,
        posterUrl: posterUploaded?.path ?? posterValue,
        previewUrl: localPreview,
        posterPreviewUrl: localPosterPreview,
      })
      setPreviewUrl(localPreview)
      setPhase({ stage: 'done', previewUrl: localPreview })
    } catch (err) {
      setPhase({ stage: 'error', message: err instanceof Error ? err.message : '处理失败' })
    }
  }

  const busy = phase.stage !== 'idle' && phase.stage !== 'done' && phase.stage !== 'error'
  const effectivePreview = phase.stage === 'done' ? phase.previewUrl : previewUrl

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-3">
        {/* 预览缩略 */}
        <div
          className={`flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed text-stone-300 transition-colors ${
            busy ? 'border-stone-400 bg-stone-100' : 'cursor-pointer border-stone-300 bg-stone-50 hover:border-stone-500'
          }`}
          onClick={() => !busy && inputRef.current?.click()}
          role="button"
          aria-label="上传视频"
        >
          {(effectivePreview || value) ? (
            <video src={effectivePreview ?? value} muted className="h-full w-full object-cover" />
          ) : busy ? (
            <span className="text-[10px] text-stone-400">处理中…</span>
          ) : (
            <span className="text-xl">＋</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />

          {/* 进度条 */}
          {busy && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>
                  {PHASE_LABEL[phase.stage]}
                  {phase.stage === 'transcoding' && ` ${Math.round(phase.progress * 100)}%`}
                </span>
                <span className="text-stone-400">视频较长时需 1–3 分钟，请勿关闭页面</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-stone-700 transition-[width] duration-300"
                  style={{
                    width: phase.stage === 'transcoding'
                      ? `${Math.max(3, phase.progress * 100)}%`
                      : phase.stage === 'loading' ? '15%' : phase.stage === 'probing' ? '8%' : '90%',
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-stone-300 px-2.5 py-1 text-[11px] text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              {busy ? '处理中…' : value ? '更换视频' : '上传视频'}
            </button>
            {value && !busy && (
              <button
                type="button"
                onClick={() => {
                  if (confirmClear) {
                    onChange({ url: '', bytes: 0, posterUrl: posterValue, previewUrl: '', posterPreviewUrl: '' })
                    setPreviewUrl(null)
                    setConfirmClear(false)
                    setPhase({ stage: 'idle' })
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

          {value && <p className="mt-1.5 truncate text-[10px] text-stone-400" title={value}>{value}</p>}
          {phase.stage === 'error' && <p className="mt-1 text-[11px] text-red-600">{phase.message}</p>}
          {phase.stage === 'done' && (
            <p className="mt-1 text-[11px] text-emerald-600">✓ 已转码上传（scrub 优化 + 海报已提取）</p>
          )}
        </div>
      </div>
    </Field>
  )
}
