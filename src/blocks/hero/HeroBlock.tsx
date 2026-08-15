import { useRef } from 'react'
import type { BlockProps } from '../types'
import type { HeroBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import SplitText from '@/components/ui/SplitText'
import Aurora from '@/components/ui/Aurora'
import { useMagnetic } from '@/hooks/useMagnetic'
import { useParallax } from '@/hooks/useParallax'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * 多层静态背景：Aurora（可选）+ 双径向光晕 + 网格纹理 + 浅色雾化层。
 * 全部纯 CSS（无 JS 动画），不存在降级问题；浅色主题下光晕透明度减半、
 * 网格用深色线 + 径向 mask 只在中心显影，避免整屏脏感。
 */
function HeroBackdrop({ isDark, aurora }: { isDark: boolean; aurora: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0"
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.16), transparent 55%), radial-gradient(circle at 70% 60%, rgba(236,72,153,0.14), transparent 55%)'
          : 'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.08), transparent 55%), radial-gradient(circle at 70% 60%, rgba(236,72,153,0.05), transparent 55%)',
      }}
    >
      {aurora}
      {/* 网格纹理：mask 让它只在中心区域显影 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: isDark ? 0.04 : 0.05,
          maskImage: 'radial-gradient(ellipse at center, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 70%)',
        }}
      />
      {/* 浅色主题雾化层：压住网格/光晕边缘，保持画面干净 */}
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60" />
      )}
    </div>
  )
}

export function HeroBlockComponent({ data, theme, index }: BlockProps<HeroBlockData>) {
  const d = data
  const isDark = theme.mode === 'dark'
  const baseDelay = index * 150

  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // 背景 + 内容反向视差（仅桌面端，hook 内部三档降级）
  useParallax(backdropRef, { speed: 0.15 })
  useParallax(contentRef, { speed: -0.1 })

  // 滚动淡出（轻量版，不 pin）：内容随滚动上移淡出。仅桌面端。
  useGSAP(
    () => {
      if (!contentRef.current || !sectionRef.current) return
      gsap.matchMedia().add(
        '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        () => {
          gsap.to(contentRef.current, {
            y: -80,
            autoAlpha: 0.1, // 不归零，防止回滚时闪空
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: 'bottom 30%',
              scrub: 1,
            },
          })
        },
      )
    },
    { scope: sectionRef },
  )

  // 主 CTA 磁吸（首个按钮更强），其余按钮保持简洁
  const primaryCtaRef = useRef<HTMLAnchorElement>(null)
  useMagnetic(primaryCtaRef, { strength: 0.3, radius: 100 })

  const auroraNode = d.useAurora ? (
    <div className={`absolute inset-0 ${isDark ? 'opacity-100' : 'opacity-50'}`}>
      <Aurora
        colorStops={theme.auroraColors || (isDark ? ['#f59e0b', '#ec4899', '#8b5cf6'] : ['#fde68a', '#fbcfe8', '#ddd6fe'])}
        amplitude={isDark ? 0.8 : 0.5}
        speed={0.4}
        blend={0.5}
      />
    </div>
  ) : null

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div ref={backdropRef}>
        <HeroBackdrop isDark={isDark} aurora={auroraNode} />
      </div>

      <div ref={contentRef} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {d.subtitle && (
          <SplitText
            text={d.subtitle}
            className={`text-xs sm:text-sm uppercase tracking-[0.4em] mb-8 font-medium justify-center ${isDark ? 'text-warm-500' : 'text-warm-600'}`}
            splitType="chars"
            from={{ y: 16, opacity: 0 }}
            to={{ y: 0, opacity: 1 }}
            delay={30}
            duration={0.7}
          />
        )}

        {/* 主标题：行遮罩揭示（yPercent 110 → 0，power4.out） */}
        <SplitText
          text={d.name}
          className={`font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.95] font-bold tracking-tight mb-8 justify-center ${
            isDark
              ? 'bg-gradient-to-b from-warm-200 via-warm-400 to-accent-pink-400 bg-clip-text text-transparent'
              : 'bg-gradient-to-b from-warm-500 via-warm-600 to-accent-pink-600 bg-clip-text text-transparent'
          }`}
          splitType="lines"
          mask="lines"
          from={{ yPercent: 110 }}
          to={{ yPercent: 0 }}
          delay={120}
          duration={1.1}
          ease="power4.out"
        />

        <AnimatedContent direction="horizontal" distance={30} delay={baseDelay + 600}>
          <p className={`text-xl sm:text-3xl lg:text-4xl font-light mb-6 font-display ${theme.subTextColor}`}>
            {d.title}
          </p>
        </AnimatedContent>

        {d.tagline && (
          <AnimatedContent direction="vertical" distance={16} delay={baseDelay + 900}>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${theme.mutedTextColor}`}>
              {d.tagline}
            </p>
          </AnimatedContent>
        )}

        {d.cta && d.cta.length > 0 && (
          <AnimatedContent direction="vertical" distance={20} delay={baseDelay + 1200}>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {d.cta.map((btn, i) => (
                <a
                  key={i}
                  ref={i === 0 ? primaryCtaRef : undefined}
                  href={btn.href}
                  data-magnetic={i === 0 ? '' : undefined}
                  className={
                    i === 0
                      ? `inline-block px-10 py-3.5 bg-gradient-to-r ${theme.primaryGradient} text-white font-medium rounded-full hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-shadow duration-300 cursor-pointer`
                      : isDark
                        ? 'inline-block px-10 py-3.5 border border-white/20 text-white/80 font-medium rounded-full hover:bg-white/10 hover:border-white/40 transition-colors duration-300 cursor-pointer'
                        : 'glass-card inline-block px-10 py-3.5 text-stone-700 font-medium rounded-full hover:bg-warm-500 hover:text-white transition-colors duration-300 cursor-pointer'
                  }
                >
                  {btn.label}
                </a>
              ))}
            </div>
          </AnimatedContent>
        )}
      </div>

      {/* 底部滚动提示竖线 */}
      <div aria-hidden className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className={`w-px h-16 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-stone-900/10'}`}>
          <div className={`w-full h-1/2 ${isDark ? 'bg-warm-400' : 'bg-warm-500'} animate-[scroll-hint_2s_ease-in-out_infinite]`} />
        </div>
      </div>
    </section>
  )
}
