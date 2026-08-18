/**
 * ffmpeg.wasm 浏览器内视频转码（admin 专用）。
 *
 * 为什么必须转码：scroll-scrub 依赖浏览器精确 seek，而浏览器只能 seek 到关键帧——
 * 原始视频关键帧间隔通常几百帧，滚动必然卡顿。重编码为 8 帧一个关键帧 + 压缩到
 * ≤8MB（10k-websites 实战参数），同时提取首帧为海报图。
 *
 * 上传前预检（probeVideo）：能否压进 8MB 基本取决于时长 × 分辨率，选文件瞬间用
 * <video> 元素秒级探测——超时长上限直接拒绝，不白加载 30MB wasm、不白等转码。
 *
 * 集成策略：
 * - @ffmpeg/ffmpeg 本体（~10KB）动态 import，仅 VideoField 首次上传时加载；
 * - wasm core（~30MB）从 unpkg CDN 经 toBlobURL 拉取（自带浏览器缓存），
 *   不打进 bundle、不用 vite-plugin——0.12.x 的 worker 与 Vite 打包有兼容坑，CDN 是社区验证路径；
 * - 单线程 core（非 mt）：mt 版需要全站 COOP/COEP headers，会波及整站与 iframe 预览，得不偿失。
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg'

/** 输出体积目标（超过则进下一档阶梯） */
const TARGET_BYTES = 8 * 1024 * 1024
/** 滚动视频时长上限（秒）——预检即拦截，8MB 码率预算下 30s 已很勉强 */
export const DURATION_LIMIT_S = 30

const CDN = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'

let ffmpegInstance: FFmpeg | null = null
let loadingPromise: Promise<FFmpeg> | null = null

async function getFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      // worker 加载要点（@ffmpeg/ffmpeg@0.12.15 的 ESM 主入口强制 type:"module" worker）：
      // 1. 不能传 classWorkerURL——官方 814.* 是 UMD 经典脚本，被当 ESM 加载会抛「Cannot find module 'blob:...'」，
      //    走默认 ./worker.js（真正的 ESM worker）即可；
      // 2. coreURL 必须用 esm 路径的「字符串 URL」直接 import（不可用 toBlobURL 包成 blob）——
      //    worker 里 import(coreURL) 要拿到 .default，而 blob 包住的 UMD 脚本没有 ESM default 导出。
      await ffmpeg.load({
        coreURL: `${CDN}/ffmpeg-core.js`,
        wasmURL: `${CDN}/ffmpeg-core.wasm`,
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

/** 编码阶梯：超 8MB 逐档下探（crf ↑ + 必要时降分辨率），尽量成功而非报错 */
const RUNGS = [
  { crf: 20, cap: 1080 }, // 源 ≤1080p 时保持原分辨率（与历史行为一致）；4K 先压到 1080p
  { crf: 26, cap: 1080 },
  { crf: 28, cap: 720 }, // 兜底：30s × ~1.5Mbps ≈ 5.6MB，绝大多数能过
] as const

/**
 * scrub 编码参数（10k-websites 实战：短关键帧是滚动流畅的关键，其余保持一致）。
 * scale 参数在 JS 侧算好（长边 > cap 才缩，`-2` 保证偶数尺寸兼容 yuv420p），
 * 不用 ffmpeg 表达式——规避 filter 内逗号在 exec 参数数组里的转义坑。
 */
function scrubArgs(crf: number, width: number, height: number, cap: number): string[] {
  const long = Math.max(width, height)
  const scale =
    long > cap
      ? width >= height
        ? `scale=${cap}:-2`
        : `scale=-2:${cap}`
      : undefined
  return [
    '-i', 'in.mp4',
    ...(scale ? ['-vf', scale] : []),
    '-c:v', 'libx264',
    '-crf', String(crf),
    '-g', '8', '-keyint_min', '8',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    'out.mp4',
  ]
}

interface ProbeResult {
  duration: number
  width: number
  height: number
}

/** 预检：createObjectURL + <video preload="metadata"> 秒级探测时长/分辨率 */
async function probeVideo(input: File): Promise<ProbeResult> {
  const url = URL.createObjectURL(input)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  try {
    const info = await new Promise<ProbeResult>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('探测超时')), 8000)
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timer)
        if (!video.videoWidth || !video.videoHeight || !isFinite(video.duration) || video.duration <= 0) {
          reject(new Error('无法读取视频信息（可能编码不受支持），请改用 MP4 (H.264) 或 WebM 格式'))
          return
        }
        resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight })
      })
      video.addEventListener('error', () => {
        clearTimeout(timer)
        reject(new Error('无法读取视频信息（可能编码不受支持），请改用 MP4 (H.264) 或 WebM 格式'))
      })
      video.src = url
    })
    return info
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
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
 * 选文件先秒级预检：超时长上限立即拒绝（不加载 wasm）；随后按编码阶梯
 * （crf ↑ + 必要时降分辨率）最多三轮，≤8MB 即停，阶梯用尽仍超才报错。
 * phase 回调：'probing'（预检）| 'loading'（加载 wasm，仅首次）| 'transcoding'（0–1）| 'poster'
 */
export async function transcodeForScrub(
  input: File,
  onPhase: (phase: { stage: 'probing' | 'loading' | 'transcoding' | 'poster'; progress: number }) => void,
): Promise<TranscodeResult> {
  onPhase({ stage: 'probing', progress: 0 })
  const { duration, width, height } = await probeVideo(input)
  if (duration > DURATION_LIMIT_S) {
    throw new Error(
      `视频 ${duration.toFixed(0)} 秒，超过 ${DURATION_LIMIT_S} 秒上限。滚动叙事视频建议 8–20 秒，请裁剪后重试`,
    )
  }

  onPhase({ stage: 'loading', progress: 0 })
  const ffmpeg = await getFFmpeg()

  await ffmpeg.writeFile('in.mp4', new Uint8Array(await input.arrayBuffer()))

  const runEncode = async (crf: number, cap: number) => {
    onPhase({ stage: 'transcoding', progress: 0 })
    bindProgress(ffmpeg, ratio => onPhase({ stage: 'transcoding', progress: ratio }))
    await ffmpeg.exec(scrubArgs(crf, width, height, cap))
    const data = await ffmpeg.readFile('out.mp4')
    return data as Uint8Array
  }

  let crf: number = RUNGS[0].crf
  let output: Uint8Array | null = null
  for (const rung of RUNGS) {
    crf = rung.crf
    output = await runEncode(rung.crf, rung.cap)
    if (output.length <= TARGET_BYTES) break
  }
  if (!output || output.length > TARGET_BYTES) {
    throw new Error(`转码后仍为 ${(output!.length / 1024 / 1024).toFixed(1)}MB（超过 8MB）。建议缩短视频后重试。`)
  }

  // 海报：首帧（从转码产物提取，与实际视频一致）
  // 崩溃根因（core 0.12.10 单线程 --arch=x86_32 --disable-asm）：mjpeg 编码器处理 yuvj420p
  // 像素格式会触发 wasm memory access out of bounds。png 编码器（无损 zlib 路径）不受该 bug 影响。
  onPhase({ stage: 'poster', progress: 1 })
  await ffmpeg.exec(['-ss', '0.1', '-i', 'out.mp4', '-frames:v', '1', 'poster.png'])
  const posterData = (await ffmpeg.readFile('poster.png')) as Uint8Array

  const baseName = input.name.replace(/\.[^.]+$/, '') || 'video'
  const result: TranscodeResult = {
    video: new File([output as unknown as BlobPart], `${baseName}-scrub.mp4`, { type: 'video/mp4' }),
    poster: new File([posterData as unknown as BlobPart], `${baseName}-poster.png`, { type: 'image/png' }),
    crf,
  }

  // 清理 FS（wasm 内存有限）
  void ffmpeg.deleteFile('in.mp4').catch(() => undefined)
  void ffmpeg.deleteFile('out.mp4').catch(() => undefined)
  void ffmpeg.deleteFile('poster.png').catch(() => undefined)

  return result
}
