import AnimatedContent from '@/components/ui/AnimatedContent'
import BlurText from '@/components/ui/BlurText'
import GradientHeading from '@/components/shared/GradientHeading'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/shared/Footer'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const experiences = [
  { period: '2022 — 至今', role: '高级前端工程师', company: '字节跳动', desc: '负责核心产品的前端架构设计与性能优化，主导设计系统的搭建与组件库开发，提升团队开发效率 40%。' },
  { period: '2020 — 2022', role: '前端开发工程师', company: '阿里巴巴', desc: '参与电商平台核心模块开发，完成从 0 到 1 的微前端架构迁移，支撑日均千万级 PV 的高并发场景。' },
  { period: '2018 — 2020', role: '初级前端工程师', company: '美团', desc: '负责商家端后台管理系统的开发与维护，独立完成多个高复杂度表单与数据可视化模块。' },
  { period: '2016 — 2018', role: '设计实习生', company: '腾讯', desc: '参与社交产品 UI 设计与交互原型制作，积累了扎实的设计基础与用户体验思维。' },
]

const skills = [
  { name: 'UI/UX 设计', level: 95, icon: '🎨', color: 'from-warm-400 to-warm-600' },
  { name: 'React / Vue', level: 90, icon: '⚡', color: 'from-accent-pink-400 to-accent-pink-600' },
  { name: 'TypeScript', level: 88, icon: '📐', color: 'from-warm-400 to-warm-600' },
  { name: '动效设计', level: 92, icon: '🎬', color: 'from-accent-pink-400 to-accent-pink-600' },
  { name: 'Node.js', level: 82, icon: '🛠', color: 'from-warm-400 to-warm-600' },
  { name: '响应式开发', level: 96, icon: '📱', color: 'from-accent-pink-400 to-accent-pink-600' },
]

export default function ResumePage() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 时间轴线滚动绘制
    if (lineRef.current && timelineRef.current) {
      gsap.to(lineRef.current, {
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 70%',
          end: 'bottom 50%',
          scrub: 1,
        },
        height: '100%',
        ease: 'none',
      })
    }

    // 技能进度条填充
    if (barsRef.current) {
      barsRef.current.querySelectorAll('[data-level]').forEach((bar) => {
        const level = bar.getAttribute('data-level')
        gsap.to(bar, {
          scrollTrigger: {
            trigger: bar,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          width: `${level}%`,
          duration: 1.2,
          ease: 'power2.out',
        })
      })
    }

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [])

  return (
    <div style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #fff7ed 50%, #fce7f3 100%)', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <BlurText
            text="张小明"
            className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-stone-900 mb-6 justify-center"
            animateBy="letters"
            delay={40}
          />
          <AnimatedContent direction="horizontal" distance={60} delay={600}>
            <p className="text-xl sm:text-2xl lg:text-3xl font-light text-stone-600 mb-4 font-display">
              高级前端工程师
            </p>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={20} delay={900}>
            <p className="text-base sm:text-lg text-stone-500 max-w-2xl mx-auto leading-relaxed">
              6 年前端开发经验，热衷于创造极致的用户体验与视觉动效。
            </p>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={30} delay={1200}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a href="#about" className="glass-card inline-block px-8 py-3 text-stone-700 font-medium hover:bg-warm-500 hover:text-white transition-all duration-300 cursor-pointer">
                了解更多
              </a>
              <a href="#contact" className="inline-block px-8 py-3 bg-gradient-to-r from-warm-500 to-accent-pink-500 text-white font-medium rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer">
                联系我
              </a>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* 关于我 */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <GradientHeading>关于我</GradientHeading>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mt-16">
            <AnimatedContent direction="horizontal" distance={-80}>
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-gradient-to-br from-warm-200 to-accent-pink-300/30 overflow-hidden shadow-xl flex items-center justify-center">
                <span className="text-6xl text-warm-600/50">📷</span>
              </div>
            </AnimatedContent>
            <div className="flex-1 text-center lg:text-left">
              <AnimatedContent direction="horizontal" distance={60} delay={200}>
                <p className="text-lg sm:text-xl text-stone-600 leading-relaxed mb-6">
                  6 年前端开发经验，专注于高性能 Web 应用与创意动效开发。曾主导多个千万级 PV 项目的前端架构设计，对用户体验有极致追求。热爱开源，善于将复杂的技术方案转化为优雅的用户体验。
                </p>
              </AnimatedContent>
              <AnimatedContent direction="vertical" distance={20} delay={400}>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  {['UI/UX 设计', '前端开发', '品牌设计', '动效设计', '用户体验'].map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-full bg-warm-100 text-warm-700 text-sm font-medium">{tag}</span>
                  ))}
                </div>
              </AnimatedContent>
            </div>
          </div>
        </div>
      </section>

      {/* 工作经历 */}
      <section id="experience" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <GradientHeading>工作经历</GradientHeading>
          <div className="relative mt-20" ref={timelineRef}>
            {/* 时间轴线 */}
            <div ref={lineRef} className="absolute left-1/2 top-0 w-[3px] h-0 -translate-x-1/2 rounded" style={{ background: 'linear-gradient(180deg, #f59e0b, #ec4899)' }} />
            {experiences.map((exp, i) => (
              <AnimatedContent key={exp.company} direction={i % 2 === 0 ? 'horizontal' : 'horizontal'} distance={i % 2 === 0 ? -60 : 60} delay={i * 100}>
                <div className="relative mb-16 md:mb-20">
                  {/* 圆点 */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 w-4 h-4 rounded-full border-3 border-white z-10" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }} />
                  <div className={`md:w-5/12 ${i % 2 === 0 ? 'md:pr-12' : 'md:ml-auto md:pl-12'}`}>
                    <GlassCard className="p-6 sm:p-8">
                      <span className="text-sm text-warm-600 font-medium">{exp.period}</span>
                      <h3 className="text-xl font-bold text-stone-800 mt-2">{exp.role}</h3>
                      <p className="text-warm-600 font-medium mt-1">{exp.company}</p>
                      <p className="text-stone-500 mt-3 leading-relaxed">{exp.desc}</p>
                    </GlassCard>
                  </div>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* 技能 */}
      <section id="skills" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <GradientHeading>专业技能</GradientHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16" ref={barsRef}>
            {skills.map((skill, i) => (
              <AnimatedContent key={skill.name} direction="vertical" distance={40} delay={i * 100}>
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skill.color} flex items-center justify-center text-white text-lg`}>{skill.icon}</div>
                    <h3 className="font-bold text-stone-800">{skill.name}</h3>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div data-level={skill.level} className="h-full rounded-full w-0" style={{ background: 'linear-gradient(90deg, #f59e0b, #ec4899)' }} />
                  </div>
                </GlassCard>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <GradientHeading>与我联系</GradientHeading>
          <p className="text-stone-500 text-lg mb-12 mt-4">期待与你交流，欢迎随时联系</p>
          <AnimatedContent direction="vertical" distance={40} scale={0.95}>
            <GlassCard className="p-8 sm:p-12 max-w-xl mx-auto">
              <div className="flex flex-col gap-6">
                <a href="mailto:hello@example.com" className="flex items-center justify-center gap-3 text-stone-700 hover:text-warm-600 transition-colors group">
                  <span className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center text-xl group-hover:bg-warm-500 group-hover:text-white transition-all">✉️</span>
                  <span className="text-lg">hello@example.com</span>
                </a>
                <a href="tel:+8613800138000" className="flex items-center justify-center gap-3 text-stone-700 hover:text-warm-600 transition-colors group">
                  <span className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center text-xl group-hover:bg-warm-500 group-hover:text-white transition-all">📱</span>
                  <span className="text-lg">+86 138-0013-8000</span>
                </a>
                <div className="flex justify-center gap-4 mt-4">
                  {[{ icon: '💻', title: 'GitHub' }, { icon: '🔗', title: 'LinkedIn' }, { icon: '📢', title: '微博' }].map(s => (
                    <span key={s.title} className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center text-xl hover:bg-warm-500 hover:text-white transition-all cursor-pointer">{s.icon}</span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </AnimatedContent>
        </div>
      </section>

      <Footer text="© 2024 张小明. 用 ❤️ 打造" />
    </div>
  )
}
