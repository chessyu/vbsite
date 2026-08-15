import { useRef } from 'react'
import type { BlockProps } from '../types'
import type { HeroBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import SplitText from '@/components/ui/SplitText'
import Aurora from '@/components/ui/Aurora'
import { useMagnetic } from '@/hooks/useMagnetic'

export function HeroBlockComponent({ data, theme, index }: BlockProps<HeroBlockData>) {
  const d = data
  const isDark = theme.mode === 'dark'
  const baseDelay = index * 150

  // 主 CTA 磁吸（首个按钮更强），其余按钮保持简洁
  const primaryCtaRef = useRef<HTMLAnchorElement>(null)
  useMagnetic(primaryCtaRef, { strength: 0.3, radius: 100 })

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {d.useAurora && (
        <div className={`absolute inset-0 z-0 ${isDark ? 'opacity-100' : 'opacity-50'}`}>
          <Aurora
            colorStops={theme.auroraColors || (isDark ? ['#f59e0b', '#ec4899', '#8b5cf6'] : ['#fde68a', '#fbcfe8', '#ddd6fe'])}
            amplitude={isDark ? 0.8 : 0.5}
            speed={0.4}
            blend={0.5}
          />
        </div>
      )}

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {d.subtitle && (
          <AnimatedContent direction="vertical" distance={20} delay={baseDelay}>
            <p className={`text-sm sm:text-base uppercase tracking-[0.3em] mb-6 font-medium ${isDark ? 'text-warm-500' : 'text-warm-600'}`}>
              {d.subtitle}
            </p>
          </AnimatedContent>
        )}

        {/* 标题统一用 GSAP SplitText（替代 motion 的 BlurText），分行入场 */}
        <SplitText
          text={d.name}
          className={`font-display text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-6 justify-center ${theme.textColor}`}
          splitType="lines"
          from={{ y: 60, opacity: 0 }}
          to={{ y: 0, opacity: 1 }}
          delay={50}
          duration={1.1}
        />

        <AnimatedContent direction="horizontal" distance={60} delay={baseDelay + 600}>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-light mb-4 font-display ${theme.subTextColor}`}>
            {d.title}
          </p>
        </AnimatedContent>

        {d.tagline && (
          <AnimatedContent direction="vertical" distance={20} delay={baseDelay + 900}>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${theme.mutedTextColor}`}>
              {d.tagline}
            </p>
          </AnimatedContent>
        )}

        {d.cta && d.cta.length > 0 && (
          <AnimatedContent direction="vertical" distance={30} delay={baseDelay + 1200}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {d.cta.map((btn, i) => (
                <a
                  key={i}
                  ref={i === 0 ? primaryCtaRef : undefined}
                  href={btn.href}
                  data-magnetic={i === 0 ? '' : undefined}
                  className={
                    i === 0
                      ? `inline-block px-8 py-3 bg-gradient-to-r ${theme.primaryGradient} text-white font-medium rounded-2xl hover:shadow-lg transition-shadow duration-300 cursor-pointer`
                      : isDark
                        ? 'inline-block px-8 py-3 border border-white/20 text-white/80 font-medium rounded-2xl hover:bg-white/10 hover:border-white/40 transition-colors duration-300 cursor-pointer'
                        : 'glass-card inline-block px-8 py-3 text-stone-700 font-medium hover:bg-warm-500 hover:text-white transition-colors duration-300 cursor-pointer'
                  }
                >
                  {btn.label}
                </a>
              ))}
            </div>
          </AnimatedContent>
        )}
      </div>
    </section>
  )
}
