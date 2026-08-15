import { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

export interface IdleFloatOptions {
  /** 浮动幅度 px，默认 8 */
  amplitude?: number
  /** 单程时长 秒，默认 3 */
  duration?: number
  /** 延迟 秒，默认 0 */
  delay?: number
}

/**
 * 呼吸感微浮动：yoyo 无限往返的 y 位移，营造静态焦点元素的「呼吸感」。
 *
 * 性能规范（gsap-performance）：
 * - 仅在元素可见时运行：ScrollTrigger.onToggle 控制离屏 pause、可见 resume，
 *   避免离屏元素空转占用 GPU。
 * - 仅动 transform(y)，yoyo 不触发布局。
 * - 三档 matchMedia：仅 isDesktop 启用；isMobile / reduce 不启用（避免持续占用）。
 */
export function useIdleFloat(
  ref: RefObject<HTMLElement | null>,
  options: IdleFloatOptions = {},
) {
  const { amplitude = 8, duration = 3, delay = 0 } = options

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
          const tween = gsap.to(el, {
            y: amplitude,
            duration,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay,
          })

          // 元素离屏自动暂停，节省 GPU。
          ScrollTrigger.create({
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
              if (self.isActive) tween.resume()
              else tween.pause()
            },
          })

          return () => {
            tween.kill()
          }
        },
      )
    },
    { scope: ref },
  )
}
