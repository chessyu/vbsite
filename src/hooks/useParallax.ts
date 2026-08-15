import { RefObject } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

export interface ParallaxOptions {
  /**
   * 视差速率。正数元素向下慢于滚动（背景感），负数向上快于滚动（前景感）。
   * 限 0.1–0.3 内为佳，超过 0.4 易晕眩。默认 0.3。
   */
  speed?: number
  /** ScrollTrigger start，默认 'top bottom' */
  start?: string
  /** ScrollTrigger end，默认 'bottom top' */
  end?: string
}

/**
 * 滚动视差：ScrollTrigger scrub 驱动元素 y 位移。
 *
 * 规范（gsap-scrolltrigger / gsap-performance）：
 * - scrub:1 给轻微滞后感；y 用函数形式按视口/元素计算，resize 自动 refresh。
 * - 仅动 transform(y)，不触发布局。
 * - 三档 matchMedia：仅 isDesktop 启用；isMobile / reduce 设 y:0 不绑定。
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  options: ParallaxOptions = {},
) {
  const { speed = 0.3, start = 'top bottom', end = 'bottom top' } = options

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop:
            '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          gsap.to(el, {
            y: () => speed * 100,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: 1,
            },
          })
        },
      )
    },
    { scope: ref },
  )
}
