import type { BlockProps } from '../types'
import type { ExperienceBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import GradientHeading from '@/components/shared/GradientHeading'
import GlassCard from '@/components/shared/GlassCard'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

export function ExperienceBlockComponent({ data, theme }: BlockProps<ExperienceBlockData>) {
  const d = data
  const timelineRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!lineRef.current || !timelineRef.current) return
      // 用 scaleY 替代 height：仅动 transform，避免滚动时 layout 抖动（gsap-performance 规范）。
      // 初始 scaleY 由 CSS h-full + 此处 gsap.set(0) 控制，transformOrigin 从顶部生长。
      gsap.set(lineRef.current, { scaleY: 0, transformOrigin: 'top center' })
      gsap.to(lineRef.current, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: timelineRef.current, start: 'top 70%', end: 'bottom 50%', scrub: 1 },
      })
    },
    { scope: timelineRef }
  )

  const isDark = theme.mode === 'dark'

  return (
    <section id="experience" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <GradientHeading>{d.heading || '工作经历'}</GradientHeading>
        <div className="relative mt-20" ref={timelineRef}>
          <div
            ref={lineRef}
            className="absolute left-1/2 top-0 w-[3px] h-full -translate-x-1/2 rounded"
            style={{ background: 'linear-gradient(180deg, #f59e0b, #ec4899)' }}
          />
          {d.experiences.map((exp, i) => (
            <AnimatedContent key={exp.company + i} direction="horizontal" distance={i % 2 === 0 ? -60 : 60} delay={i * 100}>
              <div className="relative mb-16 md:mb-20">
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-2 w-4 h-4 rounded-full z-10"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    boxShadow: '0 0 20px rgba(245,158,11,0.4)',
                    ...(isDark ? { border: '3px solid #0f0f0f' } : { border: '3px solid white' }),
                  }}
                />
                <div className={`md:w-5/12 ${i % 2 === 0 ? 'md:pr-12' : 'md:ml-auto md:pl-12'}`}>
                  <GlassCard className="p-6 sm:p-8">
                    <span className={`text-sm font-medium ${isDark ? 'text-warm-400' : 'text-warm-600'}`}>
                      {exp.period}
                    </span>
                    <h3 className={`text-xl font-bold mt-2 ${theme.textColor}`}>{exp.role}</h3>
                    <p className={`font-medium mt-1 ${isDark ? 'text-warm-400' : 'text-warm-600'}`}>{exp.company}</p>
                    <p className={`mt-3 leading-relaxed ${theme.mutedTextColor}`}>{exp.desc}</p>
                  </GlassCard>
                </div>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  )
}
