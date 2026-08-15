import type { BlockProps } from '../types'
import type { GalleryBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import GradientHeading from '@/components/shared/GradientHeading'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

const gradients = [
  'from-warm-500/30 via-accent-pink-500/20 to-violet-500/30',
  'from-violet-500/30 to-accent-pink-500/20',
  'from-accent-pink-500/30 to-warm-500/20',
]

export function GalleryBlockComponent({ data, theme }: BlockProps<GalleryBlockData>) {
  const d = data
  const galleryRef = useRef<HTMLDivElement>(null)
  const isDark = theme.mode === 'dark'

  useGSAP(
    (_context, contextSafe) => {
      if (!galleryRef.current || !contextSafe) return
      const cards = galleryRef.current.querySelectorAll<HTMLElement>('[data-tilt]')

      // 三档 matchMedia：仅桌面端启用 3D 倾斜 + 滚动视差，移动端/reduce 全部跳过。
      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop:
            '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          const parallaxSpeeds = [0.15, 0.25, 0.1]

          cards.forEach((el, i) => {
            gsap.set(el, { transformPerspective: 1000 })

            // 滚动视差：每张卡按 index%3 不同速率，形成前后层次。
            const speed = parallaxSpeeds[i % 3]
            gsap.to(el, {
              y: () => speed * 80,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            })

            // 用 quickTo 复用 tween：鼠标高频移动时避免反复创建 tween（gsap-performance 规范）。
            const rotXTo = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2.out' })
            const rotYTo = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2.out' })
            const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.4, ease: 'power2.out' })

            // contextSafe 包裹：保证组件卸载后回调失效，且随 context 一起 cleanup（gsap-react 规范）。
            const onMove = contextSafe((e: MouseEvent) => {
              const rect = el.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              rotXTo(((y - rect.height / 2) / rect.height) * -8)
              rotYTo(((x - rect.width / 2) / rect.width) * 8)
              scaleTo(1.03)
            })
            const onLeave = contextSafe(() => {
              rotXTo(0)
              rotYTo(0)
              scaleTo(1)
            })

            el.addEventListener('mousemove', onMove)
            el.addEventListener('mouseleave', onLeave)
          })
        },
      )
    },
    { scope: galleryRef }
  )

  return (
    <section id="gallery" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <GradientHeading>{d.heading || '精选作品'}</GradientHeading>
        {d.subheading && (
          <p className={`text-center mb-16 text-lg ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{d.subheading}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" ref={galleryRef}>
          {d.projects.map((p, i) => (
            <AnimatedContent key={p.title} direction="vertical" distance={60} delay={i * 100}>
              <div
                data-tilt
                className={`group relative overflow-hidden rounded-xl cursor-pointer ${p.wide ? 'sm:col-span-2 lg:row-span-2' : ''}`}
                style={{ minHeight: p.wide ? '400px' : '280px' }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${gradients[i % 3]} flex items-center justify-center absolute inset-0`}>
                  <div className="text-center p-8">
                    <div className={`${p.wide ? 'text-6xl' : 'text-5xl'} mb-4`}>{p.icon}</div>
                    <p className={`${p.wide ? 'text-2xl' : 'text-lg'} font-bold text-white/80`}>{p.title}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-amber-600/90 via-pink-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-6">
                  <span className="text-xs uppercase tracking-widest text-white/70 mb-1">{p.category}</span>
                  <h3 className={`${p.wide ? 'text-2xl' : 'text-xl'} font-bold text-white`}>{p.title}</h3>
                  <p className="text-white/80 mt-2 text-sm">{p.desc}</p>
                </div>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  )
}
