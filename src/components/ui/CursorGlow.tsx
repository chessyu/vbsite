import { useRef, useState, useEffect } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

interface CursorGlowProps {
  /** 浅色主题用 multiply 柔光，深色主题用 screen 提亮，默认浅色 */
  dark?: boolean
}

/**
 * 全局光标光斑：桌面端跟随鼠标的柔光圆斑（径向渐变），带轻微滞后拖尾质感。
 *
 * 规范（gsap-performance / gsap-react）：
 * - quickTo 复用 x/y/scale tween；hover 到可交互元素放大，增加反馈。
 * - pointer-events:none，不干扰交互；mix-blend-mode 与背景柔和融合。
 * - 仅 isDesktop 渲染：isMobile / reduce 直接不创建 DOM、不绑监听。
 */
export default function CursorGlow({ dark = false }: CursorGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  // 仅桌面端（且非 reduced-motion）渲染。
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(
      {
        isDesktop:
          '(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
      },
      (ctx) => {
        if ((ctx.conditions as { isDesktop: boolean })?.isDesktop) {
          setEnabled(true)
        }
      },
    )
    return () => mm.revert()
  }, [])

  useGSAP(
    (_ctx, contextSafe) => {
      const el = glowRef.current
      if (!el || !contextSafe) return

      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
      const scaleTo = gsap.quickTo(el, 'scale', {
        duration: 0.4,
        ease: 'power2.out',
      })

      const onMove = contextSafe((e: MouseEvent) => {
        xTo(e.clientX)
        yTo(e.clientY)
        const target = e.target as Element
        const interactive = target.closest(
          'a, button, [data-magnetic], input, [role="button"]',
        )
        scaleTo(interactive ? 1.8 : 1)
      })

      window.addEventListener('mousemove', onMove, { passive: true })
      return () => window.removeEventListener('mousemove', onMove)
    },
    { scope: glowRef, dependencies: [enabled] },
  )

  if (!enabled) return null

  // 浅底用 multiply 柔光（warm 色），深底用 screen 提亮。
  const color = dark ? 'rgba(251,191,36,0.18)' : 'rgba(245,158,11,0.16)'

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        mixBlendMode: dark ? 'screen' : 'multiply',
        willChange: 'transform',
      }}
    />
  )
}
