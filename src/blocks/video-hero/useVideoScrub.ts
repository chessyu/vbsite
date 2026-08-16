import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import type { Caption } from './types'

/**
 * 滚动 scrub 引擎：滚动进度 0–1 驱动视频 currentTime 与字幕带。
 *
 * 架构（10k-websites 方法论 + GSAP 原生能力）：
 * - progress 计算交给 ScrollTrigger（trigger=外层轨道，start/end 覆盖整个滚动区间，无 pin）；
 * - lerp 平滑用 `scrub: 1` 自带的 catch-up（gsap tween 每 ticker 帧向目标指数逼近），
 *   不自建 rAF 循环 —— ticker 驱动、离屏自动停转、useGSAP revert 自动 cleanup；
 * - onUpdate 里做两件事（顺序重要）：
 *   1) 字幕带 delta-gated DOM 更新（永远即时，不等视频）；
 *   2) 视频 seek 门控（上一 seek 未完成只合并最新目标，防 Chrome 下 seek 堆积卡顿）。
 */

export interface VideoScrubOptions {
  /** 外层滚动轨道（高度 heightVh 的容器） */
  trackRef: RefObject<HTMLElement | null>
  /** 视频元素 */
  videoRef: RefObject<HTMLVideoElement | null>
  /** 字幕条目 */
  captions: Caption[]
  /** 字幕 DOM 收集表（key = 数组下标，由组件回调 ref 填充） */
  captionEls: RefObject<Map<number, HTMLDivElement>>
  /** 结尾静置 CTA 元素（progress > 0.96 淡入） */
  ctaRef: RefObject<HTMLElement | null>
  /** 滚动轨道高度（vh），用于把缓入缓出边沿换算成进度单位 */
  heightVh: number
}

/** 缓入缓出边沿 ≈ 20vh（换算成 0–1 进度） */
const EDGE_VH = 20

function smoothstep(p: number, e0: number, e1: number): number {
  if (e1 <= e0) return p >= e1 ? 1 : 0
  const t = Math.min(1, Math.max(0, (p - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

export function useVideoScrub(options: VideoScrubOptions) {
  const { trackRef, videoRef, captions, captionEls, ctaRef, heightVh } = options
  // 最新 captions 存 ref：字幕文字在编辑器里频繁变化，避免重建 ScrollTrigger
  const captionsRef = useRef(captions)
  useEffect(() => {
    captionsRef.current = captions
  }, [captions])

  useEffect(() => {
    // 组件卸载时字幕/CTA 内联样式可能残留（React 不管我们写的 style 属性）
    const els = captionEls.current
    const cta = ctaRef.current
    return () => {
      els.forEach(el => {
        el.style.opacity = ''
        el.style.setProperty('--k', '')
      })
      if (cta) (cta as HTMLElement).style.opacity = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useGSAP(
    () => {
      if (!trackRef.current) return
      const video = videoRef.current

      // ---- seek 门控（死锁安全）----
      let seekLocked = false
      let pendingTime: number | null = null
      let unlockTimer: ReturnType<typeof setTimeout> | null = null

      const unlock = () => {
        seekLocked = false
        video?.removeEventListener('seeked', onSeeked)
        if (unlockTimer) clearTimeout(unlockTimer)
        // 有被合并的最新目标 → 补一次
        if (pendingTime !== null && video) {
          const t = pendingTime
          pendingTime = null
          requestSeek(t)
        }
      }
      const onSeeked = () => unlock()
      const requestSeek = (t: number) => {
        if (!video || !isFinite(video.duration)) return
        // 帧差以内不值得 seek
        if (Math.abs(video.currentTime - t) < 0.033) return
        if (seekLocked) {
          pendingTime = t // 合并：只保留最新
          return
        }
        seekLocked = true
        video.addEventListener('seeked', onSeeked)
        unlockTimer = setTimeout(unlock, 500) // seeked 丢失时的死锁保险
        try {
          video.currentTime = t
        } catch {
          unlock()
        }
      }

      // ---- 字幕带更新（delta-gated）----
      const lastK = new Map<number, number>()
      const edge = Math.min(0.06, EDGE_VH / heightVh)

      const updateCaptions = (p: number) => {
        const caps = captionsRef.current
        const els = captionEls.current
        if (!els) return
        caps.forEach((cap, i) => {
          const el = els.get(i)
          if (!el) return
          const k = smoothstep(p, cap.from, cap.from + edge) * (1 - smoothstep(p, cap.to - edge, cap.to))
          const prev = lastK.get(i)
          if (prev !== undefined && Math.abs(k - prev) < 0.01) return // delta-gate
          lastK.set(i, k)
          el.style.opacity = String(k)
          el.style.setProperty('--k', String(k))
        })
        // 结尾静置 CTA
        const cta = ctaRef.current
        if (cta) {
          const ck = smoothstep(p, 0.96, 0.995)
          const ctaEl = cta as HTMLElement
          if (Math.abs(ctaEl.offsetWidth) >= 0) {
            // opacity 直写（cta 也参与 delta-gate 语义：值变化极小时浏览器自身去重）
            ctaEl.style.opacity = String(ck)
          }
        }
      }

      // ---- scrub 主链 ----
      const proxy = { p: 0 }
      const tween = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: trackRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // catch-up 平滑 = lerp
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          updateCaptions(proxy.p)
          if (video && isFinite(video.duration)) {
            requestSeek(proxy.p * video.duration)
          }
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        unlock()
      }
    },
    { scope: trackRef },
  )
}
