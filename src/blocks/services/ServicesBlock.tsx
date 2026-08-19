import type { BlockProps } from '../types'
import type { ServicesBlockData } from './types'
import AnimatedContent from '@/components/ui/AnimatedContent'
import GradientHeading from '@/components/shared/GradientHeading'

export function ServicesBlockComponent({ data, theme }: BlockProps<ServicesBlockData>) {
  const d = data
  const isDark = theme.mode === 'dark'

  return (
    <section id="services" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <GradientHeading>{d.heading || '我能做什么'}</GradientHeading>
        {d.subheading && (
          <p className={`text-center mb-16 text-lg ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{d.subheading}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {d.services.map((s, i) => (
            <AnimatedContent key={s.title} direction="horizontal" distance={i % 2 === 0 ? -60 : 60} delay={i * 100}>
              <div className={`p-8 text-center ${isDark ? 'glass-card-dark' : 'glass-card'}`}>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : theme.textColor}`}>{s.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-stone-400' : theme.mutedTextColor}`}>{s.desc}</p>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  )
}
