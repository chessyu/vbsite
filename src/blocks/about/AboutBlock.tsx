import { useRef } from 'react'
import type { BlockProps } from '../types'
import type { AboutBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import GradientHeading from '@/components/shared/GradientHeading'
import { useIdleFloat } from '@/hooks/useIdleFloat'

export function AboutBlockComponent({ data, theme }: BlockProps<AboutBlockData>) {
  const d = data
  const isDark = theme.mode === 'dark'

  // 头像呼吸浮动（仅桌面端）
  const avatarRef = useRef<HTMLDivElement>(null)
  useIdleFloat(avatarRef, { amplitude: 5, duration: 4 })

  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <GradientHeading>{d.heading || '关于我'}</GradientHeading>
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mt-16">
          <AnimatedContent direction="horizontal" distance={-80}>
            <div ref={avatarRef} className={`w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-xl flex items-center justify-center ${
              isDark
                ? 'bg-gradient-to-br from-warm-500/20 to-accent-pink-500/10'
                : 'bg-gradient-to-br from-warm-200 to-accent-pink-300/30'
            }`}>
              <span className={`text-6xl ${isDark ? 'text-warm-400/60' : 'text-warm-600/50'}`}>
                {d.avatar || '📷'}
              </span>
            </div>
          </AnimatedContent>
          <div className="flex-1 text-center lg:text-left">
            <AnimatedContent direction="horizontal" distance={60} delay={200}>
              <p className={`text-lg sm:text-xl leading-relaxed mb-6 ${theme.subTextColor}`}>
                {d.bio}
              </p>
            </AnimatedContent>
            {d.tags && d.tags.length > 0 && (
              <AnimatedContent direction="vertical" distance={20} delay={400}>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  {d.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        isDark
                          ? 'bg-white/10 text-stone-300'
                          : 'bg-warm-100 text-warm-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </AnimatedContent>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
