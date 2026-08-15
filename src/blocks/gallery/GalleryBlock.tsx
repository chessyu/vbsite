import { useState } from 'react'
import type { BlockProps } from '../types'
import type { GalleryBlockData, Project } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import GradientHeading from '@/components/shared/GradientHeading'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/** 无图降级形态的卡面渐变（按 index 循环） */
const fallbackGradients = [
  'from-warm-500/90 via-accent-pink-500/60 to-violet-500/90',
  'from-violet-500/90 to-accent-pink-500/60',
  'from-accent-pink-500/90 to-warm-500/60',
]

/** 装饰序号（StarPage 年表卡手法）：01 / 02 ... */
function serial(i: number) {
  return String(i + 1).padStart(2, '0')
}

/**
 * 单张作品卡：双形态。
 * - 有图：object-cover 真图 + CSS hover scale + 常驻底部深色渐变保证文字可读
 * - 无图：渐变卡面 + 大 emoji + 装饰序号 + 径向高光（emoji/首字符兜底）
 * hover scale 用 CSS、tilt/视差用 GSAP——transform 分层管理，互不覆盖。
 */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [imgFailed, setImgFailed] = useState(false)
  const hasImage = !!project.image && !imgFailed
  const fallbackIcon = project.icon || project.category.charAt(0)
  const maxTags = project.wide ? 6 : 4
  const tags = project.tags?.slice(0, maxTags) ?? []

  return (
    <div
      data-tilt
      className={`group relative overflow-hidden rounded-xl ${project.wide ? 'sm:col-span-2 lg:row-span-2' : ''}`}
      style={{ minHeight: project.wide ? '400px' : '280px' }}
    >
      {/* 底层：图或渐变卡面 */}
      {hasImage ? (
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${fallbackGradients[index % 3]} flex items-center justify-center`}
        >
          {/* 径向高光：给纯渐变卡面加层次 */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25), transparent 55%)' }}
          />
          <div className="text-center p-8 relative">
            <div className={project.wide ? 'text-7xl mb-4' : 'text-6xl mb-3'}>{fallbackIcon}</div>
          </div>
        </div>
      )}

      {/* 常驻内容：category 大写 + 标题（有图时靠底部深色渐变保证可读） */}
      <div
        className={`absolute inset-0 flex flex-col ${
          project.wide ? 'justify-end p-8' : 'justify-end p-6'
        }`}
      >
        <div
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent transition-opacity duration-400 ${hasImage ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="relative">
          <span className="text-xs uppercase tracking-[0.25em] text-white/70 mb-2 block">
            {project.category}
          </span>
          <h3 className={`${project.wide ? 'text-3xl' : 'text-xl'} font-bold text-white`}>
            {project.title}
          </h3>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map(t => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm text-xs text-white/85"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* hover 遮罩：desc 详情 */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-600/90 via-pink-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-6 z-10">
        <p className="text-white/90 text-sm leading-relaxed max-w-md">{project.desc}</p>
      </div>

      {/* 装饰序号（无图形态更明显，有图时低透明度点缀） */}
      <span
        aria-hidden
        className={`absolute top-4 right-5 font-display font-bold select-none pointer-events-none ${
          project.wide ? 'text-8xl' : 'text-7xl'
        } ${hasImage ? 'text-white/15' : 'text-white/10'}`}
      >
        {serial(index)}
      </span>
    </div>
  )
}

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
            // 有图卡 scale 收到 1.02（真图放大过大会糊）；tilt 幅度 10°。
            const rotXTo = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2.out' })
            const rotYTo = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2.out' })
            const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.4, ease: 'power2.out' })

            // contextSafe 包裹：保证组件卸载后回调失效，且随 context 一起 cleanup（gsap-react 规范）。
            const onMove = contextSafe((e: MouseEvent) => {
              const rect = el.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              rotXTo(((y - rect.height / 2) / rect.height) * -10)
              rotYTo(((x - rect.width / 2) / rect.width) * 10)
              scaleTo(1.02)
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
              <ProjectCard project={p} index={i} />
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  )
}
