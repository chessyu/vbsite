import { RefObject } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

export interface MagneticOptions {
  /** 偏移系数，鼠标到位时元素最大位移 = 距离 * strength，默认 0.3 */
  strength?: number
  /** 触发半径 px，鼠标进入半径范围才开始吸引，默认 120 */
  radius?: number
}

/**
 * 磁吸按钮：鼠标靠近时元素被「吸引」偏移，离开回弹。
 *
 * 性能规范（gsap-performance / gsap-react）：
 * - 用 gsap.quickTo 复用 x/y tween，避免高频 mousemove 反复创建 tween。
 * - window 级监听，计算鼠标到元素中心距离，在 radius 内按 strength 插值。
 * - contextSafe 包裹回调，随 context 一起 cleanup。
 * - 三档 matchMedia：仅 isDesktop 启用；isMobile（无 hover）/ reduce 不绑监听。
 */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  options: MagneticOptions = {},
) {
  const { strength = 0.3, radius = 120 } = options

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current
      if (!el || !contextSafe) return

      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })

      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop:
            '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          const onMove = contextSafe((e: MouseEvent) => {
            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = e.clientX - cx
            const dy = e.clientY - cy
            const dist = Math.hypot(dx, dy)
            // 距离越近吸引越强；超出 radius 不动。
            if (dist > radius) {
              xTo(0)
              yTo(0)
              return
            }
            const falloff = 1 - dist / radius
            xTo(dx * strength * falloff)
            yTo(dy * strength * falloff)
          })

          window.addEventListener('mousemove', onMove, { passive: true })
          return () => window.removeEventListener('mousemove', onMove)
        },
      )
    },
    { scope: ref },
  )
}
