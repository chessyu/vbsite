import { useEffect, useState } from 'react'

/**
 * 视频 Blob 加载器。
 *
 * 为什么全量 Blob 而不是直接 <video src>：
 * - 很多托管不支持 HTTP Range，seek 会钳制到 0 —— scrub 在线上完全失效（本地却正常）；
 *   objectURL 的 Blob 视频无此问题。
 * - 大文件（>8MB 或大小未知）流式下载 + 进度回调（驱动 SVG 进度环），
 *   20s 无进展 watchdog 中止 → error 降级（poster 兜底，页面永远完整）。
 */

export type VideoLoadStatus =
  | { state: 'idle' }
  | { state: 'loading'; progress: number } // 0–1，大小未知时恒 0（转圈即可）
  | { state: 'ready'; url: string }
  | { state: 'error' }

const STREAM_THRESHOLD_BYTES = 8 * 1024 * 1024
const WATCHDOG_MS = 20_000

export function useVideoLoader(src: string | undefined, bytes: number | undefined): VideoLoadStatus {
  const [status, setStatus] = useState<VideoLoadStatus>({ state: 'idle' })

  useEffect(() => {
    if (!src) return
    let cancelled = false
    let objectUrl: string | null = null
    const controller = new AbortController()
    let watchdog: ReturnType<typeof setTimeout> | null = null

    const fail = () => {
      if (!cancelled) setStatus({ state: 'error' })
      controller.abort()
    }
    const armWatchdog = () => {
      if (watchdog) clearTimeout(watchdog)
      watchdog = setTimeout(() => controller.abort(), WATCHDOG_MS)
    }

    async function load() {
      setStatus({ state: 'loading', progress: 0 })
      try {
        armWatchdog()
        const res = await fetch(src!, { signal: controller.signal, priority: 'low' as RequestPriority })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        // 小文件：直接 blob
        if (bytes !== undefined && bytes < STREAM_THRESHOLD_BYTES) {
          const blob = await res.blob()
          if (cancelled) return
          objectUrl = URL.createObjectURL(blob)
          setStatus({ state: 'ready', url: objectUrl })
          return
        }

        // 大文件或大小未知：流式累计 + 进度
        const total = Number(res.headers.get('Content-Length')) || bytes || 0
        const reader = res.body?.getReader()
        if (!reader) throw new Error('no body')
        const chunks: BlobPart[] = []
        let got = 0
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          armWatchdog()
          chunks.push(value as unknown as BlobPart)
          got += value.length
          if (!cancelled && total > 0) {
            setStatus({ state: 'loading', progress: Math.min(1, got / total) })
          }
        }
        if (cancelled) return
        objectUrl = URL.createObjectURL(new Blob(chunks, { type: res.headers.get('Content-Type') || 'video/mp4' }))
        setStatus({ state: 'ready', url: objectUrl })
      } catch (err) {
        if (!cancelled && (err as Error)?.name !== 'AbortError') fail()
        else if (!cancelled) fail()
      }
    }

    void load()

    return () => {
      cancelled = true
      controller.abort()
      if (watchdog) clearTimeout(watchdog)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, bytes])

  return status
}
