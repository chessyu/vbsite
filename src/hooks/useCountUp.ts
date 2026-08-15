import { RefObject } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

export interface CountUpOptions {
  /** 目标数值，默认 0 */
  end?: number
  /** 起始数值，默认 0 */
  start?: number
  /** 时长 秒，默认 2 */
  duration?: number
  /** 数字格式化（千分位、小数等），默认原样 */
  format?: (n: number) => string
  /** ScrollTrigger 触发起点，默认 'top 80%' */
  triggerStart?: string
  /** 是否一次触发，默认 true */
  once?: boolean
}

/**
 * 数字滚动计数：元素进入视口时，从 start 滚动到 end。
 *
 * 规范（gsap-core / gsap-performance）：
 * - 用一个代理对象 { val } 承载计数，onUpdate 时 format 并写入 textContent，
 *   避免每帧触发 React 重渲染。
 * - 仅在桌面端启用，移动端/reduce 直接显示终值。
 * - 元素需有初始 textContent 兜底（终值），防 JS 未执行时不可读。
 */
export function useCountUp(
  ref: RefObject<HTMLElement | null>,
  options: CountUpOptions = {},
) {
  const {
    end = 0,
    start = 0,
    duration = 2,
    format = (n) => String(Math.round(n)),
    triggerStart = 'top 80%',
    once = true,
  } = options

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop:
            '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          fallback:
            '(max-width: 767px), (prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { isDesktop } = ctx.conditions as { isDesktop: boolean }

          // 移动端/reduce 直接显示终值。
          if (!isDesktop) {
            el.textContent = format(end)
            return
          }

          const counter = { val: start }
          gsap.to(counter, {
            val: end,
            duration,
            ease: 'power2.out',
            snap: { val: 1 },
            onUpdate: () => {
              el.textContent = format(counter.val)
            },
            scrollTrigger: {
              trigger: el,
              start: triggerStart,
              once,
            },
          })
        },
      )
    },
    { scope: ref },
  )
}
