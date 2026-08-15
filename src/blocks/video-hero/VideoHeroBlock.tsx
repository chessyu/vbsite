import { useCallback, useEffect, useRef, useState } from 'react'
import type { BlockProps } from '../types'
import type { VideoHeroBlockData } from './types'
import { STATIC_FALLBACK_QUERY } from './staticFallback'
import { useVideoLoader } from './useVideoLoader'
import { useVideoScrub } from './useVideoScrub'

/**
 * 电影感滚动视频首屏（10k-websites 方法论落地）：
 * - 外层 heightVh 容器撑出滚动轨道（CSS sticky，不用 ScrollTrigger pin——项目既有约定）；
 * - 内层 sticky stage：poster → video(blob) → scrim → 字幕带 → 结尾 CTA → 进度环；
 * - 五档静态降级门（staticFallback.ts）live 重评估，降级档不下载任何视频字节；
 * - 视频加载失败 → poster 兜底，页面永远完整。
 *
 * 分层原则：React 管结构（字幕条目/模式切换），scrub 循环管样式（opacity/--k/currentTime）。
 */

/** 五档门 + live 重评估：旋转设备/拖窗/中途改 reduce 即时切换 */
function useIsCinematic(): boolean {
  const [isCinematic, setIsCinematic] = useState(
    () => typeof window === 'undefined' || !window.matchMedia(STATIC_FALLBACK_QUERY).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(STATIC_FALLBACK_QUERY)
    const apply = () => setIsCinematic(!mql.matches)
    apply()
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [])
  return isCinematic
}

const POSITION_CLASS: Record<string, string> = {
  center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center',
  left: 'left-[8%] top-1/2 -translate-y-1/2 text-left',
  right: 'right-[8%] top-1/2 -translate-y-1/2 text-right',
  bottom: 'left-1/2 bottom-[12%] -translate-x-1/2 text-center',
}

const SIZE_CLASS: Record<string, string> = {
  lg: 'text-[clamp(2rem,6vw,4.5rem)] font-display font-bold',
  md: 'text-[clamp(1.25rem,3.5vw,2.5rem)] font-display',
  sm: 'text-[clamp(1rem,2vw,1.5rem)]',
}

export function VideoHeroBlockComponent({ data }: BlockProps<VideoHeroBlockData>) {
  const d = data
  const isCinematic = useIsCinematic()

  // 电影模式下才加载视频（降级档 0 视频字节）。
  // 会话内 blob 预览优先（远端路径刚上传还未部署，fetch 必 404）。
  const videoSrc = d.video.previewUrl || d.video.url
  const videoStatus = useVideoLoader(
    isCinematic ? videoSrc : undefined,
    isCinematic && !videoSrc?.startsWith('blob:') ? d.video.bytes : undefined,
  )
  // 海报同样会话内 blob 预览优先
  const posterSrc = d.posterPreviewUrl || d.poster

  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const captionEls = useRef<Map<number, HTMLDivElement>>(new Map())
  const setCaptionEl = useCallback((i: number) => (el: HTMLDivElement | null) => {
    if (el) captionEls.current.set(i, el)
    else captionEls.current.delete(i)
  }, [])

  useVideoScrub({
    trackRef,
    videoRef,
    captions: d.captions,
    captionEls,
    ctaRef,
    heightVh: d.heightVh,
  })

  // 视频就绪：淡出 poster（video 在 poster 上层淡入）
  const videoReady = videoStatus.state === 'ready'
  useEffect(() => {
    if (!posterRef.current) return
    posterRef.current.style.opacity = videoReady ? '0' : '1'
  }, [videoReady])

  // 视频就绪后设置 src 并立即 seek 到当前进度（首帧不闪 0s）
  useEffect(() => {
    if (!videoRef.current || videoStatus.state !== 'ready') return
    const video = videoRef.current
    video.src = videoStatus.url
    const onCanPlay = () => {
      // 落在当前滚动位置对应的时间点
      if (trackRef.current && isFinite(video.duration) && video.duration > 0) {
        const rect = trackRef.current.getBoundingClientRect()
        const total = rect.height - window.innerHeight
        const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
        try {
          video.currentTime = p * video.duration
        } catch {
          /* ignore */
        }
      }
    }
    video.addEventListener('loadedmetadata', onCanPlay, { once: true })
    video.load()
    return () => video.removeEventListener('loadedmetadata', onCanPlay)
  }, [videoStatus])

  /* ---------- 共享 JSX ---------- */

  const kickerAndText = (cap: { kicker?: string; text: string }) => (
    <>
      {cap.kicker && (
        <span className="vh-kicker mb-4 inline-block rounded-full bg-black/45 backdrop-blur-sm px-4 py-1.5 text-xs tracking-[0.25em] text-white/90">
          {cap.kicker}
        </span>
      )}
      <span className="vh-text-shadow block whitespace-pre-wrap">{cap.text}</span>
    </>
  )

  const ctaButton = d.cta ? (
    <a
      href={d.cta.href}
      className="inline-block px-10 py-3.5 bg-white/95 text-stone-900 font-medium rounded-full
        hover:bg-white hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] transition-all duration-300"
    >
      {d.cta.label}
    </a>
  ) : null

  /* ---------- 静态降级 hero（五档门 + 加载失败共用） ---------- */

  if (!isCinematic || videoStatus.state === 'error') {
    return (
      <section className="relative min-h-screen overflow-hidden bg-stone-900">
        {/* 海报底图（为空时纯深色底，避免 img src="" 警告） */}
        {posterSrc ? (
          <img src={posterSrc} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-warm-900/40" />
        )}
        <div className="vh-global-scrim absolute inset-0" />
        {d.overlayTint && <div className="absolute inset-0" style={{ background: d.overlayTint }} />}

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="vh-text-shadow max-w-4xl font-display text-[clamp(2.5rem,8vw,6rem)] font-bold leading-tight text-white">
            {d.fallbackHeading}
          </h1>
          {d.fallbackSub && (
            <p className="vh-text-shadow mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-white/85">
              {d.fallbackSub}
            </p>
          )}
          {d.cta && <div className="mt-10">{ctaButton}</div>}
        </div>
      </section>
    )
  }

  /* ---------- 电影模式 ---------- */

  return (
    <div ref={trackRef} style={{ height: `${d.heightVh}vh` }} className="relative">
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* 层1：海报（视频未就绪/加载中的底；为空时深色渐变底） */}
        {posterSrc ? (
          <img
            ref={posterRef}
            src={posterSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-warm-900/40" />
        )}

        {/* 层2：视频（合成层提升，仅 transform/opacity 动画） */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ transform: 'translateZ(0)', opacity: videoReady ? 1 : 0, transition: 'opacity 0.7s' }}
        />

        {/* 全局 scrim + 可选色调 */}
        <div className="vh-global-scrim absolute inset-0" />
        {d.overlayTint && <div className="absolute inset-0" style={{ background: d.overlayTint }} />}

        {/* 层3：字幕带（React 管结构，scrub 直写 opacity/--k） */}
        <div className="absolute inset-0 z-10">
          {d.captions.map((cap, i) => (
            <div
              key={i}
              ref={setCaptionEl(i)}
              className={`vh-caption absolute max-w-[80vw] px-6 text-white ${POSITION_CLASS[cap.position]} ${SIZE_CLASS[cap.size]}`}
              style={{ opacity: 0 }}
            >
              {kickerAndText(cap)}
            </div>
          ))}
        </div>

        {/* 结尾静置 CTA（scrub 直写 opacity） */}
        {d.cta && (
          <div
            ref={ctaRef}
            className="absolute bottom-[14%] left-1/2 z-10 -translate-x-1/2"
            style={{ opacity: 0 }}
          >
            {ctaButton}
          </div>
        )}

        {/* 标题语义：电影模式下 h1 对读屏/SEO 可见 */}
        <h1 className="sr-only">{d.fallbackHeading}</h1>

        {/* 大文件流式加载进度环 */}
        {videoStatus.state === 'loading' && d.video.bytes !== undefined && d.video.bytes >= 8 * 1024 * 1024 && (
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2" aria-hidden>
            <svg viewBox="0 0 48 48" className="h-10 w-10 text-white/80">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="126"
                strokeDashoffset={126 * (1 - videoStatus.progress)}
                transform="rotate(-90 24 24)"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 四层可读性系统的 CSS（scoped，常量同源见 staticFallback.ts 注释） */}
      <style>{`
        .vh-global-scrim {
          background: radial-gradient(ellipse 120% 90% at 50% 45%, rgba(10,10,18,0) 35%, rgba(10,10,18,0.62) 100%);
        }
        .vh-caption::before {
          content: "";
          position: absolute;
          inset: -6% -4%;
          pointer-events: none;
          background: radial-gradient(ellipse 74% 62% at 50% 50%, rgba(5,5,10,0.66) 0%, rgba(5,5,10,0.44) 46%, rgba(5,5,10,0) 76%);
          opacity: calc(0.25 + 0.75 * var(--k, 0));
          z-index: -1;
        }
        .vh-text-shadow {
          text-shadow: 0 1px 2px rgba(5,5,10,0.95), 0 3px 12px rgba(5,5,10,0.78), 0 10px 44px rgba(5,5,10,0.8);
        }
      `}</style>
    </div>
  )
}
