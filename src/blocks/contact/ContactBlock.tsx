import type { BlockProps } from '../types'
import type { ContactBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import SplitText from '@/components/ui/SplitText'
import GlassCard from '@/components/shared/GlassCard'

export function ContactBlockComponent({ data, theme }: BlockProps<ContactBlockData>) {
  const d = data
  const isDark = theme.mode === 'dark'

  return (
    <section id="contact" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <SplitText
          text={d.heading || (isDark ? "Let's Work Together" : '与我联系')}
          className={`font-display text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 ${theme.textColor}`}
          splitType="lines"
          delay={60}
          duration={1}
        />
        <p className={`text-lg mb-10 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          {d.subheading || (isDark ? '有项目想法？让我们一起把它变成现实。' : '期待与你交流，欢迎随时联系')}
        </p>

        {d.showAvailability && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full relative">
              <span className="absolute inset-[-4px] rounded-full border-2 border-green-500 animate-ping" />
            </span>
            <span className="text-sm text-green-400">目前可接项目</span>
          </div>
        )}

        <AnimatedContent direction="vertical" distance={40} scale={0.95}>
          <div className={`p-8 max-w-xl mx-auto ${isDark ? 'glass-card-dark' : ''}`}>
            <GlassCard className={isDark ? '!bg-transparent !backdrop-blur-none !border-0 !shadow-none p-0' : ''}>
              <div className="flex flex-col gap-6">
                {d.email && (
                  <a
                    href={`mailto:${d.email}`}
                    className={`flex items-center justify-center gap-3 transition-colors group ${
                      isDark ? 'text-white hover:text-warm-500' : 'text-stone-700 hover:text-warm-600'
                    }`}
                  >
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                      isDark
                        ? 'bg-white/5 group-hover:bg-warm-500/20'
                        : 'bg-warm-100 group-hover:bg-warm-500 group-hover:text-white'
                    }`}>✉️</span>
                    <span className="text-lg">{d.email}</span>
                  </a>
                )}
                {d.phone && (
                  <a
                    href={`tel:${d.phone}`}
                    className={`flex items-center justify-center gap-3 transition-colors group ${
                      isDark ? 'text-white hover:text-warm-500' : 'text-stone-700 hover:text-warm-600'
                    }`}
                  >
                    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                      isDark
                        ? 'bg-white/5 group-hover:bg-warm-500/20'
                        : 'bg-warm-100 group-hover:bg-warm-500 group-hover:text-white'
                    }`}>📱</span>
                    <span className="text-lg">{d.phone}</span>
                  </a>
                )}
                {d.socials && d.socials.length > 0 && (
                  <div className="flex justify-center gap-4 mt-4">
                    {d.socials.map(s => (
                      <span
                        key={s.title}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                          isDark
                            ? `bg-white/5 ${s.bg || 'hover:bg-warm-500/20'}`
                            : 'bg-warm-100 hover:bg-warm-500 hover:text-white'
                        }`}
                      >
                        {s.icon}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </AnimatedContent>
      </div>
    </section>
  )
}
