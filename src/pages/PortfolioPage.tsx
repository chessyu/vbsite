import AnimatedContent from '@/components/ui/AnimatedContent'
import SplitText from '@/components/ui/SplitText'
import GradientHeading from '@/components/shared/GradientHeading'
import Footer from '@/components/shared/Footer'
import Aurora from '@/components/ui/Aurora'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const projects = [
  { title: '科技公司全案设计', category: '品牌设计', icon: '🎨', desc: '从 Logo 到完整的品牌视觉体系，包含色彩、字体、图标与应用规范。', wide: true },
  { title: '健康追踪 App', category: 'APP 设计', icon: '📱', desc: '清新简洁的健康数据可视化界面设计。', wide: false },
  { title: '电商平台重构', category: '网页设计', icon: '🌐', desc: '现代化电商体验设计，提升转化率 35%。', wide: false },
  { title: '产品宣传动效', category: '动效', icon: '🎬', desc: '为科技产品打造的系列动态视觉。', wide: false },
  { title: '企业级组件库', category: '系统设计', icon: '✨', desc: '包含 200+ 组件的完整设计系统。', wide: true },
  { title: '艺术展览海报', category: '印刷设计', icon: '📐', desc: '融合东方美学与现代排版的展览视觉。', wide: false },
]

const services = [
  { title: 'UI/UX 设计', icon: '🎨', desc: '以用户为中心的界面设计，兼顾美观与可用性。' },
  { title: '前端开发', icon: '💻', desc: '高性能、高动效的 Web 前端实现，像素级还原设计。' },
  { title: '动效设计', icon: '🎬', desc: '让页面"活"起来的交互动效，提升用户体验。' },
  { title: '品牌设计', icon: '✨', desc: '从 Logo 到完整视觉体系，打造独特的品牌形象。' },
]

export default function PortfolioPage() {
  const galleryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 画廊卡片鼠标跟随倾斜（仅桌面端）
    if (galleryRef.current && window.innerWidth >= 768) {
      const cards = galleryRef.current.querySelectorAll('[data-tilt]')
      cards.forEach((card) => {
        const el = card as HTMLElement
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const rotateX = ((y - rect.height / 2) / rect.height) * -8
          const rotateY = ((x - rect.width / 2) / rect.width) * 8
          gsap.to(el, { rotateX, rotateY, scale: 1.03, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 })
        })
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.5, ease: 'power2.out' })
        })
      })
    }
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f', color: '#fafaf9' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Aurora colorStops={['#f59e0b', '#ec4899', '#8b5cf6']} amplitude={0.8} speed={0.5} blend={0.4} />
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <AnimatedContent direction="vertical" distance={20}>
            <p className="text-warm-500 text-sm sm:text-base uppercase tracking-[0.3em] mb-6 font-medium">
              Creative Designer & Developer
            </p>
          </AnimatedContent>
          <SplitText
            text="李设计"
            className="font-display text-5xl sm:text-7xl lg:text-9xl font-bold tracking-tight mb-6 justify-center"
            delay={50}
          />
          <AnimatedContent direction="vertical" distance={20} delay={600}>
            <p className="text-lg sm:text-xl lg:text-2xl text-stone-400 font-light max-w-2xl mx-auto leading-relaxed">
              用设计讲述故事，用代码创造体验。<br/>专注于品牌视觉、UI/UX 设计与创意动效。
            </p>
          </AnimatedContent>
          <AnimatedContent direction="vertical" distance={30} delay={900}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a href="#gallery" className="inline-block px-8 py-3 bg-gradient-to-r from-warm-500 to-accent-pink-500 text-white font-medium rounded-2xl hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer">
                查看作品
              </a>
              <a href="#contact" className="inline-block px-8 py-3 border border-white/20 text-white/80 font-medium rounded-2xl hover:bg-white/10 hover:border-white/40 transition-all duration-300 cursor-pointer">
                联系我
              </a>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* 画廊 */}
      <section id="gallery" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <GradientHeading>精选作品</GradientHeading>
          <p className="text-center text-stone-500 mb-16 text-lg">每一个项目都是一次创意的旅程</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" ref={galleryRef}>
            {projects.map((p, i) => (
              <AnimatedContent key={p.title} direction="vertical" distance={60} delay={i * 100}>
                <div data-tilt className={`group relative overflow-hidden rounded-xl cursor-pointer ${p.wide ? 'sm:col-span-2 lg:row-span-2' : ''}`} style={{ minHeight: p.wide ? '400px' : '280px' }}>
                  <div className={`w-full h-full bg-gradient-to-br ${i % 3 === 0 ? 'from-warm-500/30 via-accent-pink-500/20 to-violet-500/30' : i % 3 === 1 ? 'from-violet-500/30 to-accent-pink-500/20' : 'from-accent-pink-500/30 to-warm-500/20'} flex items-center justify-center absolute inset-0`}>
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

      {/* 精选项目 */}
      <section id="featured" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <GradientHeading>深度案例</GradientHeading>
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mt-16">
            <AnimatedContent direction="horizontal" distance={-60} delay={200} className="lg:w-3/5">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-warm-500/30 via-accent-pink-500/20 to-violet-500/30 flex items-center justify-center relative overflow-hidden">
                <div className="text-center relative z-10">
                  <div className="text-8xl mb-6">🚀</div>
                  <p className="text-3xl font-bold text-white/60 font-display">Featured Project</p>
                </div>
              </div>
            </AnimatedContent>
            <AnimatedContent direction="horizontal" distance={60} delay={400} className="lg:w-2/5">
              <span className="text-warm-500 text-sm uppercase tracking-widest font-medium">Featured Project</span>
              <h3 className="text-2xl sm:text-3xl font-bold mt-3 mb-4">智慧城市数据可视化平台</h3>
              <p className="text-stone-400 leading-relaxed mb-6">
                为某一线城市打造的智慧城市数据可视化大屏系统。整合交通、环境、能源等多维度数据，以直观的视觉语言呈现城市脉搏。
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {['数据可视化', '大屏设计', 'D3.js', 'Three.js', '实时数据'].map(tag => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-sm ${tag.includes('数据') || tag.includes('Three') ? 'bg-warm-500/15 text-warm-400' : 'bg-accent-pink-500/15 text-accent-pink-400'}`}>{tag}</span>
                ))}
              </div>
            </AnimatedContent>
          </div>
        </div>
      </section>

      {/* 服务介绍 */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <GradientHeading>我能做什么</GradientHeading>
          <p className="text-center text-stone-500 mb-16 text-lg">与你一起，把创意变成现实</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <AnimatedContent key={s.title} direction={i % 2 === 0 ? 'horizontal' : 'horizontal'} distance={i % 2 === 0 ? -60 : 60} delay={i * 100}>
                <div className="glass-card-dark p-8 text-center">
                  <div className="text-4xl mb-4">{s.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section id="contact" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">Let&apos;s Work Together</h2>
          <p className="text-stone-400 text-lg mb-10">有项目想法？让我们一起把它变成现实。</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full relative">
              <span className="absolute inset-[-4px] rounded-full border-2 border-green-500 animate-ping" />
            </span>
            <span className="text-sm text-green-400">目前可接项目</span>
          </div>
          <AnimatedContent direction="vertical" distance={40} scale={0.95}>
            <div className="glass-card-dark p-8 max-w-lg mx-auto">
              <a href="mailto:hello@example.com" className="flex items-center justify-center gap-3 text-white hover:text-warm-500 transition-colors group mb-4">
                <span className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl group-hover:bg-warm-500/20 transition-all">✉️</span>
                <span className="text-lg">hello@example.com</span>
              </a>
              <div className="flex justify-center gap-4 mt-6">
                {[{ icon: '💻', bg: 'hover:bg-warm-500/20 hover:text-warm-400' }, { icon: '🏀', bg: 'hover:bg-accent-pink-500/20 hover:text-accent-pink-400' }, { icon: '🎯', bg: 'hover:bg-violet-500/20 hover:text-violet-400' }, { icon: '💬', bg: 'hover:bg-warm-500/20 hover:text-warm-400' }].map(s => (
                  <span key={s.icon} className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl transition-all cursor-pointer ${s.bg}`}>{s.icon}</span>
                ))}
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section>

      <Footer dark text="© 2024 李设计. Designed with passion." />
    </div>
  )
}
