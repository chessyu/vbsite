import type { BlockProps } from '../types'
import type { SkillsBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import GradientHeading from '@/components/shared/GradientHeading'
import GlassCard from '@/components/shared/GlassCard'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

export function SkillsBlockComponent({ data, theme }: BlockProps<SkillsBlockData>) {
  const d = data
  const barsRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!barsRef.current) return
      const bars = barsRef.current.querySelectorAll<HTMLElement>('[data-level]')
      // 用 scaleX 替代 width：仅动 transform，避免 layout 抖动（gsap-performance 规范）。
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' })
      bars.forEach((bar) => {
        const level = Number(bar.getAttribute('data-level')) || 0
        gsap.to(bar, {
          scaleX: level / 100,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 85%', toggleActions: 'play none none reverse' },
        })
      })

      // 技能图标呼吸浮动（仅桌面端，极小幅），用 data-skill-icon 标记，离屏自动暂停。
      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop:
            '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          const icons = barsRef.current!.querySelectorAll<HTMLElement>('[data-skill-icon]')
          icons.forEach((icon, i) => {
            gsap.to(icon, {
              y: 3,
              duration: 3,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
              delay: i * 0.2,
              scrollTrigger: {
                trigger: icon,
                start: 'top bottom',
                end: 'bottom top',
                toggleActions: 'play pause resume pause',
              },
            })
          })
        },
      )
    },
    { scope: barsRef }
  )

  const isDark = theme.mode === 'dark'

  return (
    <section id="skills" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <GradientHeading>{d.heading || '专业技能'}</GradientHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16" ref={barsRef}>
          {d.skills.map((skill, i) => (
            <AnimatedContent key={skill.name} direction="vertical" distance={40} delay={i * 100}>
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div data-skill-icon className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skill.color} flex items-center justify-center text-white text-lg`}>
                    {skill.icon}
                  </div>
                  <h3 className={`font-bold ${theme.textColor}`}>{skill.name}</h3>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}>
                  <div
                    data-level={skill.level}
                    className="h-full rounded-full w-full origin-left"
                    style={{ background: 'linear-gradient(90deg, #f59e0b, #ec4899)' }}
                  />
                </div>
              </GlassCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  )
}
