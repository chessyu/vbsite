/**
 * ffmpeg.wasm 浏览器内视频转码（admin 专用）。
 *
 * 为什么必须转码：scroll-scrub 依赖浏览器精确 seek，而浏览器只能 seek 到关键帧——
 * 原始视频关键帧间隔通常几百帧，滚动必然卡顿。重编码为 8 帧一个关键帧 + 压缩到
 * ≤8MB（10k-websites 实战参数），同时提取首帧为海报图。
 *
 * 集成策略：
 * - @ffmpeg/ffmpeg 本体（~10KB）动态 import，仅 VideoField 首次上传时加载；
 * - wasm core（~30MB）从 unpkg CDN 经 toBlobURL 拉取（自带浏览器缓存），
 *   不打进 bundle、不用 vite-plugin——0.12.x 的 worker 与 Vite 打包有兼容坑，CDN 是社区验证路径；
 * - 单线程 core（非 mt）：mt 版需要全站 COOP/COEP headers，会波及整站与 iframe 预览，得不偿失。
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg'

/** 输出体积目标（超过则提高 crf 重试一轮） */
const TARGET_BYTES = 8 * 1024 * 1024

const CDN = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd'
/** @ffmpeg/ffmpeg 本体的 worker chunk（umd 经典脚本；Vite 下默认 new URL worker 打包会失败，必须显式给） */
const FFMPEG_CDN = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd'

let ffmpegInstance: FFmpeg | null = null
let loadingPromise: Promise<FFmpeg> | null = null

async function getFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CDN}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CDN}/ffmpeg-core.wasm`, 'application/wasm'),
        // 关键：Vite dev/build 下默认的 new Worker(new URL('./worker.js', import.meta.url))
        // 解析失败导致 Worker 构造抛错。显式指定 umd worker chunk 的 blob URL 绕开。
        classWorkerURL: await toBlobURL(`${FFMPEG_CDN}/814.ffmpeg.js`, 'text/javascript'),
      })
      ffmpegInstance = ffmpeg
      return ffmpeg
    })()
  }
  const ffmpeg = await loadingPromise
  if (onProgress) bindProgress(ffmpeg, onProgress)
  return ffmpeg
}

const progressHandlers = new WeakMap<FFmpeg, (event: { progress: number; time: number }) => void>()

function bindProgress(ffmpeg: FFmpeg, handler: (ratio: number) => void) {
  const existing = progressHandlers.get(ffmpeg)
  if (existing) ffmpeg.off('progress', existing)
  const callback = ({ progress }: { progress: number; time: number }) =>
    handler(Math.min(1, Math.max(0, progress)))
  ffmpeg.on('progress', callback)
  progressHandlers.set(ffmpeg, callback)
}

/** scrub 编码参数（10k-websites 实战：短关键帧是滚动流畅的关键，其余保持一致） */
function scrubArgs(crf: number): string[] {
  return [
    '-i', 'in.mp4',
    '-c:v', 'libx264',
    '-crf', String(crf),
    '-g', '8', '-keyint_min', '8',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    'out.mp4',
  ]
}

export interface TranscodeResult {
  /** 转码后的视频文件（File，可直接走上传链路） */
  video: File
  /** 首帧海报 jpg */
  poster: File
  /** 实际使用的 crf（重试后可能提高） */
  crf: number
}

/**
 * 转码 + 海报提取。
 * >8MB 时自动 crf 20 → 26 重试一轮，仍超则抛错提示（不无限降质）。
 * phase 回调：'loading'（加载 wasm，仅首次）| 'transcoding'（0–1）| 'poster'
 */
export async function transcodeForScrub(
  input: File,
  onPhase: (phase: { stage: 'loading' | 'transcoding' | 'poster'; progress: number }) => void,
): Promise<TranscodeResult> {
  onPhase({ stage: 'loading', progress: 0 })
  const ffmpeg = await getFFmpeg()

  await ffmpeg.writeFile('in.mp4', new Uint8Array(await input.arrayBuffer()))

  const runEncode = async (crf: number) => {
    onPhase({ stage: 'transcoding', progress: 0 })
    bindProgress(ffmpeg, ratio => onPhase({ stage: 'transcoding', progress: ratio }))
    await ffmpeg.exec(scrubArgs(crf))
    const data = await ffmpeg.readFile('out.mp4')
    return data as Uint8Array
  }

  let crf = 20
  let output = await runEncode(crf)
  if (output.length > TARGET_BYTES) {
    // 超目标体积 → 提高压缩率重试一轮
    crf = 26
    output = await runEncode(crf)
  }
  if (output.length > TARGET_BYTES) {
    throw new Error(`转码后仍为 ${(output.length / 1024 / 1024).toFixed(1)}MB（超过 8MB）。建议缩短视频或降低分辨率后重试。`)
  }

  // 海报：首帧 jpg（从转码产物提取，与实际视频一致）
  onPhase({ stage: 'poster', progress: 1 })
  await ffmpeg.exec(['-i', 'out.mp4', '-ss', '0.1', '-frames:v', '1', '-q:v', '2', 'poster.jpg'])
  const posterData = (await ffmpeg.readFile('poster.jpg')) as Uint8Array

  const baseName = input.name.replace(/\.[^.]+$/, '') || 'video'
  const result: TranscodeResult = {
    video: new File([output as unknown as BlobPart], `${baseName}-scrub.mp4`, { type: 'video/mp4' }),
    poster: new File([posterData as unknown as BlobPart], `${baseName}-poster.jpg`, { type: 'image/jpeg' }),
    crf,
  }

  // 清理 FS（wasm 内存有限）
  void ffmpeg.deleteFile('in.mp4').catch(() => undefined)
  void ffmpeg.deleteFile('out.mp4').catch(() => undefined)
  void ffmpeg.deleteFile('poster.jpg').catch(() => undefined)

  return result
}
