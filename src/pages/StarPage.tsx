import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import SplitText from '@/components/ui/SplitText'
import CursorGlow from '@/components/ui/CursorGlow'
import { useMagnetic } from '@/hooks/useMagnetic'
import { useParallax } from '@/hooks/useParallax'
import { useIdleFloat } from '@/hooks/useIdleFloat'
import { useCountUp } from '@/hooks/useCountUp'

/**
 * GSAP 高动效个人主页 Demo —— 以刘德华为例。
 * 设计：深色电影感 + 金色点缀，Motion-Driven 风格。
 * 动效：Hero 逐字遮罩揭示、数字滚动计数、横向 pin 时间线、影廊 3D 倾斜、语录视差。
 */

// ===== 内容数据 =====
const PROFILE = {
  name: '刘德华',
  nameEn: 'ANDY LAU',
  title: '演员 · 歌手 · 制片人',
  tagline: '四十余年，用作品陪伴几代人。',
}

const STATS = [
  { end: 160, suffix: '+', label: '参演电影' },
  { end: 100, suffix: '+', label: '音乐专辑' },
  { end: 500, suffix: '+', label: '个人演唱会' },
  { end: 600, suffix: '+', label: '获奖与提名' },
]

const FILMOGRAPHY = [
  { year: '2002', title: '无间道', role: '刘建明', desc: '卧底警匪经典，香港电影里程碑' },
  { year: '1999', title: '暗战', role: '华', desc: '凭此首夺香港金像奖最佳男主角' },
  { year: '2015', title: '失孤', role: '雷泽宽', desc: '寻子父亲，朴素催泪之作' },
  { year: '2007', title: '门徒', role: '林昆', desc: '颠覆形象演绎毒枭' },
  { year: '2023', title: '流浪地球2', role: '图恒宇', desc: '中国科幻巨制，数字生命' },
]

const GALLERY = [
  { title: '舞台之王', category: 'CONCERT', icon: '🎤', color: 'from-amber-500/40 via-rose-500/20 to-transparent' },
  { title: '银幕传奇', category: 'CINEMA', icon: '🎬', color: 'from-yellow-500/30 via-orange-500/20 to-transparent', wide: true },
  { title: '时光金曲', category: 'MUSIC', icon: '🎵', color: 'from-rose-500/40 via-amber-500/20 to-transparent' },
  { title: '慈善之心', category: 'CHARITY', icon: '🤝', color: 'from-orange-500/40 via-amber-400/20 to-transparent' },
]

const QUOTES = [
  '你以为你是谁，',
  '你以为你是刘德华啊？',
]

export default function StarPage() {
  // 关键修复：Timeline 的 pin 会插入 .pin-spacer 改变文档流，导致后续区块
  // （Quote 等）的 ScrollTrigger 位置算错、入场动画卡在初始 opacity:0。
  // 在组件树挂载、字体加载、pin 建立后统一 refresh 一次，让所有 trigger 重算。
  useGSAP(() => {
    const refresh = () => ScrollTrigger.refresh()
    // 字体加载会改变分行，必须 refresh（SplitText 已等 fonts.ready，这里再兜底）
    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh)
    }
    // 延迟一帧，确保 pin 已建立
    const id = window.setTimeout(refresh, 100)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-stone-100 overflow-x-hidden">
      <CursorGlow dark />
      <HeroSection />
      <StatsSection />
      <TimelineSection />
      <GallerySection />
      <QuoteSection />
      <FooterCTA />
    </div>
  )
}

/* ============ Hero：逐字遮罩揭示 + 背景视差 ============ */
function HeroSection() {
  const rootRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const magneticRef = useRef<HTMLAnchorElement>(null)

  useParallax(bgRef, { speed: 0.15 })
  useMagnetic(magneticRef, { strength: 0.3, radius: 100 })

  // 姓名遮罩揭示：每行从 mask 下滑入（overflow-hidden + yPercent）
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          const lines = rootRef.current?.querySelectorAll('[data-mask-line] span')
          if (lines) {
            gsap.from(lines, {
              yPercent: 110,
              duration: 1.1,
              ease: 'power4.out',
              stagger: 0.12,
              delay: 0.2,
            })
          }
        },
      )
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景径向光晕 + 视差 */}
      <div ref={bgRef} className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(244,63,94,0.10),transparent_50%)]" />
        {/* 细密网格纹理 */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <SplitText
          text={PROFILE.title}
          className="text-xs sm:text-sm uppercase tracking-[0.4em] text-amber-400/80 mb-8"
          splitType="chars"
          delay={30}
          duration={0.8}
        />

        {/* 中文姓名：遮罩揭示 */}
        <h1 className="font-display font-bold leading-[0.95] mb-6 overflow-hidden">
          <span data-mask-line="cn" className="block text-7xl sm:text-8xl lg:text-[10rem] bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            <span className="inline-block">刘德华</span>
          </span>
        </h1>

        {/* 英文名：遮罩揭示 */}
        <div className="overflow-hidden mb-10">
          <span data-mask-line="en" className="block text-lg sm:text-2xl tracking-[0.5em] text-stone-400">
            <span className="inline-block">ANDY LAU</span>
          </span>
        </div>

        <p className="text-lg sm:text-xl text-stone-400 max-w-xl mx-auto leading-relaxed mb-12">
          {PROFILE.tagline}
        </p>

        <div className="flex justify-center gap-4">
          <a
            ref={magneticRef}
            href="#timeline"
            data-magnetic
            className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-bold rounded-full hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-shadow duration-300 cursor-pointer"
          >
            浏览作品
          </a>
        </div>
      </div>

      {/* 向下提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />
      </div>
    </section>
  )
}

/* ============ 数字成就：滚动计数 ============ */
function StatsSection() {
  return (
    <section className="py-24 px-6 border-y border-white/5">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
        {STATS.map((s) => (
          <StatItem key={s.label} {...s} />
        ))}
      </div>
    </section>
  )
}

function StatItem({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const numRef = useRef<HTMLSpanElement>(null)
  useCountUp(numRef, { end, duration: 2.2, format: (n) => `${Math.round(n)}${suffix}` })

  return (
    <div className="text-center">
      <div className="font-display text-5xl sm:text-6xl font-bold bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent mb-2">
        {/* 兜底：JS 未执行时也显示终值 */}
        <span ref={numRef}>{end}{suffix}</span>
      </div>
      <div className="text-sm text-stone-500 uppercase tracking-widest">{label}</div>
    </div>
  )
}

/* ============ 作品年表：横向 pin 滚动 ============ */
function TimelineSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = section?.querySelector('[data-track]')
      if (!section || !track) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          // pin 住横向轨道，纵向滚动驱动其水平位移
          const getScrollAmount = () => track.scrollWidth - window.innerWidth + 96
          gsap.to(track, {
            x: () => -getScrollAmount(),
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${getScrollAmount()}`,
              scrub: 1,
              pin: true,
              invalidateOnRefresh: true,
            },
          })
        },
      )
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} id="timeline" className="relative h-screen overflow-hidden flex flex-col justify-center">
      <div className="px-6 lg:px-12 mb-10">
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-stone-100">
          经典<span className="text-amber-400">年表</span>
        </h2>
        <p className="text-stone-500 mt-2">横向滚动浏览代表作 →</p>
      </div>
      <div className="overflow-hidden">
        <div data-track className="flex gap-8 px-6 lg:px-12 will-change-transform">
          {FILMOGRAPHY.map((f) => (
            <article
              key={f.title}
              className="group relative flex-shrink-0 w-[78vw] sm:w-[420px] h-[60vh] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-stone-900 to-stone-950"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.15),transparent_60%)]" />
              <div className="relative z-10 h-full flex flex-col justify-between p-8 sm:p-10">
                <div className="font-display text-7xl sm:text-8xl font-bold text-amber-500/30">{f.year}</div>
                <div>
                  <div className="text-amber-400 text-sm uppercase tracking-widest mb-3">{f.role}</div>
                  <h3 className="font-display text-4xl sm:text-5xl font-bold text-stone-50 mb-4">{f.title}</h3>
                  <p className="text-stone-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 影廊：3D 倾斜 + hover 揭示 ============ */
function GallerySection() {
  const galleryRef = useRef<HTMLDivElement>(null)

  useGSAP(
    (_ctx, contextSafe) => {
      const root = galleryRef.current
      if (!root || !contextSafe) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        },
        () => {
          const cards = root.querySelectorAll<HTMLElement>('[data-tilt]')
          cards.forEach((el) => {
            gsap.set(el, { transformPerspective: 1000 })
            const rotXTo = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power2.out' })
            const rotYTo = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power2.out' })

            const onMove = contextSafe((e: MouseEvent) => {
              const rect = el.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              rotXTo(((y - rect.height / 2) / rect.height) * -10)
              rotYTo(((x - rect.width / 2) / rect.width) * 10)
            })
            const onLeave = contextSafe(() => {
              rotXTo(0)
              rotYTo(0)
            })
            el.addEventListener('mousemove', onMove)
            el.addEventListener('mouseleave', onLeave)
          })
        },
      )
    },
    { scope: galleryRef },
  )

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-stone-100">
            多面<span className="text-amber-400">舞台</span>
          </h2>
        </div>
        <div ref={galleryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY.map((g) => (
            <div
              key={g.title}
              data-tilt
              className={`group relative overflow-hidden rounded-2xl border border-white/10 cursor-pointer ${g.wide ? 'sm:col-span-2' : ''}`}
              style={{ minHeight: g.wide ? '340px' : '280px' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
                <div className="text-5xl mb-4 opacity-80">{g.icon}</div>
                <div className="text-xs text-stone-400 uppercase tracking-widest mb-1">{g.category}</div>
                <div className="font-display text-2xl font-bold text-stone-50">{g.title}</div>
              </div>
              <div className="absolute inset-0 bg-stone-950/60 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-center justify-center">
                <span className="px-6 py-2.5 border border-amber-400/50 text-amber-300 rounded-full text-sm font-medium">
                  查看更多
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 语录：逐行视差渐显 ============ */
function QuoteSection() {
  const quoteRef = useRef<HTMLDivElement>(null)
  useParallax(quoteRef, { speed: 0.2 })

  return (
    <section className="py-32 px-6">
      <div ref={quoteRef} className="max-w-4xl mx-auto text-center">
        <SplitText
          text={QUOTES[0]}
          className="font-display text-3xl sm:text-5xl font-bold text-stone-300 mb-2 leading-relaxed"
          splitType="lines"
          delay={50}
          duration={1.2}
        />
        <SplitText
          text={QUOTES[1]}
          className="font-display text-3xl sm:text-5xl font-bold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent leading-relaxed"
          splitType="lines"
          delay={400}
          duration={1.2}
        />
        <p className="mt-8 text-stone-600 text-sm uppercase tracking-widest">— 经典台词</p>
      </div>
    </section>
  )
}

/* ============ 页脚 CTA ============ */
function FooterCTA() {
  const iconRef = useRef<HTMLDivElement>(null)
  useIdleFloat(iconRef, { amplitude: 8, duration: 4 })

  return (
    <footer className="py-24 px-6 border-t border-white/5 text-center">
      <div ref={iconRef} className="text-5xl mb-6">✦</div>
      <h3 className="font-display text-3xl sm:text-4xl font-bold text-stone-100 mb-4">永远的偶像</h3>
      <p className="text-stone-500 mb-8">感谢四十余年的陪伴</p>
      <div className="flex justify-center gap-6 text-sm text-stone-400">
        <span className="hover:text-amber-400 transition-colors cursor-pointer">微博</span>
        <span className="hover:text-amber-400 transition-colors cursor-pointer">官网</span>
        <span className="hover:text-amber-400 transition-colors cursor-pointer">联系</span>
      </div>
      <p className="mt-12 text-stone-700 text-xs">© Demo Page · 由 VBSite 高动效引擎驱动</p>
    </footer>
  )
}
