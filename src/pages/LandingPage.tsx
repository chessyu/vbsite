import AnimatedContent from '@/components/ui/AnimatedContent'
import BlurText from '@/components/ui/BlurText'
import GradientHeading from '@/components/shared/GradientHeading'
import GlassCard from '@/components/shared/GlassCard'
import Footer from '@/components/shared/Footer'

export default function LandingPage() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fce7f3 70%, #ede9fe 100%)', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <AnimatedContent direction="vertical" distance={20}>
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 backdrop-blur text-warm-700 text-sm font-medium mb-8">
              ✨ 高动效 × 轻量化 × 专属定制
            </div>
          </AnimatedContent>

          <BlurText
            text="你的专属高定网页"
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 mb-6 leading-tight justify-center"
            animateBy="words"
            delay={100}
          />

          <AnimatedContent direction="vertical" distance={30} delay={600}>
            <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed mb-10">
              极致的视觉动效，轻量化的交付体验。<br/>个人简历、作品集、展示页——让世界看到一个不一样的你。
            </p>
          </AnimatedContent>

          <AnimatedContent direction="vertical" distance={40} delay={900}>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#demos" className="px-8 py-4 bg-gradient-to-r from-warm-500 to-accent-pink-500 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300 text-lg cursor-pointer">
                查看 Demo
              </a>
              <a href="#contact" className="glass-card inline-block px-8 py-4 text-stone-700 font-bold hover:bg-white/90 transition-all duration-300 text-lg cursor-pointer">
                立即咨询
              </a>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* 优势 */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <GradientHeading>为什么选择 VBSite</GradientHeading>
          <p className="text-center text-stone-500 mb-16 text-lg">告别千篇一律的模板站</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🎬', title: '震撼动效', bg: 'from-warm-400 to-warm-600', desc: 'GSAP 专业级动画，滚动视差、文字动效、鼠标跟随……你的页面会"动"起来。' },
              { icon: '⚡', title: '极速加载', bg: 'from-accent-pink-400 to-accent-pink-600', desc: '纯静态单文件，无需服务器，全球 CDN 加速，毫秒级打开。' },
              { icon: '🎨', title: '完全定制', bg: 'from-violet-400 to-violet-500', desc: '不是套模板——每一页都根据你的需求量身打造，独一无二。' },
            ].map((item, i) => (
              <AnimatedContent key={item.title} direction="vertical" distance={50} delay={i * 200}>
                <GlassCard className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.bg} flex items-center justify-center text-3xl text-white mx-auto mb-6`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed">{item.desc}</p>
                </GlassCard>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* Demo 展示 */}
      <section id="demos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <GradientHeading>在线 Demo</GradientHeading>
          <p className="text-center text-stone-500 mb-16 text-lg">所见即所得——这些就是你能拿到的效果</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatedContent direction="horizontal" distance={-60} delay={200}>
              <a href="/resume" className="demo-preview block group rounded-2xl overflow-hidden hover:scale-[1.03] hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 cursor-pointer">
                <div className="aspect-[4/3] bg-gradient-to-br from-warm-100 via-warm-200 to-accent-pink-300/20 relative">
                  <div className="absolute inset-4 sm:inset-8 rounded-xl bg-white/50 backdrop-blur p-4 sm:p-6">
                    <div className="h-3 w-24 bg-warm-400/40 rounded mb-3"></div>
                    <div className="h-2 w-16 bg-stone-300/40 rounded mb-6"></div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-stone-200/50 rounded"></div>
                      <div className="h-2 w-4/5 bg-stone-200/50 rounded"></div>
                      <div className="h-2 w-3/5 bg-stone-200/50 rounded"></div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-warm-300/40"></div>
                      <div className="h-8 w-8 rounded-lg bg-accent-pink-300/30"></div>
                      <div className="h-8 w-8 rounded-lg bg-warm-300/40"></div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-warm-500 text-white text-sm font-medium">暖色系</div>
                </div>
                <div className="p-6 bg-white/60 backdrop-blur">
                  <h3 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-warm-600 transition-colors">个人简历模板</h3>
                  <p className="text-stone-500">温暖渐变风格，逐字动效 + 时间轴滚动绘制 + 技能进度条</p>
                </div>
              </a>
            </AnimatedContent>

            <AnimatedContent direction="horizontal" distance={60} delay={400}>
              <a href="/portfolio" className="demo-preview block group rounded-2xl overflow-hidden hover:scale-[1.03] hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 cursor-pointer">
                <div className="aspect-[4/3] bg-gradient-to-br from-stone-900 via-stone-800 to-violet-900/30 relative">
                  <div className="absolute inset-4 sm:inset-8 rounded-xl overflow-hidden">
                    <div className="text-center mb-4">
                      <div className="h-3 w-20 bg-warm-500/40 rounded mx-auto mb-2"></div>
                      <div className="h-2 w-12 bg-stone-600/50 rounded mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 sm:h-16 rounded-lg bg-warm-500/15"></div>
                      <div className="h-12 sm:h-16 rounded-lg bg-accent-pink-500/15"></div>
                      <div className="h-12 sm:h-16 rounded-lg bg-violet-500/15"></div>
                      <div className="h-12 sm:h-16 rounded-lg bg-warm-500/15"></div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-violet-500 text-white text-sm font-medium">深色系</div>
                </div>
                <div className="p-6 bg-white/60 backdrop-blur">
                  <h3 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-violet-600 transition-colors">作品集模板</h3>
                  <p className="text-stone-500">深色沉浸风格，浮动几何 + 画廊鼠标跟随倾斜 + 视差滚动</p>
                </div>
              </a>
            </AnimatedContent>
          </div>
        </div>
      </section>

      {/* 定价 */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <GradientHeading>价格方案</GradientHeading>
          <p className="text-center text-stone-500 mb-16 text-lg">简单透明，没有隐藏费用</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: '方案 A', title: '源码交付', price: '¥599', unit: '起', features: ['完整 HTML 源码包', '高动效专业级动画', '完美移动端适配', '上线后 7 天免费微调'], featured: false },
              { label: '方案 B', title: '平台托管', price: '¥399', unit: '起制作 + ¥99/年', features: ['方案 A 全部内容', '免费 HTTPS 安全证书', '全球 CDN 加速', '持续技术维护与保障'], featured: true },
            ].map((plan) => (
              <AnimatedContent key={plan.label} direction="vertical" distance={60} delay={plan.featured ? 200 : 0}>
                <div className={`p-8 sm:p-10 rounded-2xl transition-all duration-400 hover:-translate-y-2 hover:shadow-xl ${plan.featured ? 'bg-gradient-to-br from-warm-500/10 to-accent-pink-500/10 border border-warm-500/40' : 'bg-white/60 backdrop-blur border border-white/40'}`}>
                  {plan.featured && <div className="inline-block px-4 py-1 bg-gradient-to-r from-warm-500 to-accent-pink-500 text-white text-xs font-bold rounded-full mb-4">推荐</div>}
                  <div className="text-sm text-warm-600 font-medium uppercase tracking-wider mb-2">{plan.label}</div>
                  <h3 className="text-2xl font-bold text-stone-800 mb-2">{plan.title}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold text-stone-900">{plan.price}</span>
                    <span className="text-stone-400">{plan.unit}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-stone-600">
                        <span className="w-5 h-5 rounded-full bg-warm-100 flex items-center justify-center text-warm-600 text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#contact" className={`block text-center px-6 py-3 font-bold rounded-2xl transition-all duration-300 cursor-pointer ${plan.featured ? 'bg-gradient-to-r from-warm-500 to-accent-pink-500 text-white hover:shadow-lg hover:shadow-warm-500/25' : 'border-2 border-warm-500 text-warm-600 hover:bg-warm-500 hover:text-white'}`}>
                    咨询详情
                  </a>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">准备好了吗？</h2>
          <p className="text-stone-500 text-lg mb-12">扫码添加微信，开始你的高定网页之旅</p>

          <AnimatedContent direction="vertical" distance={40} scale={0.95}>
            <GlassCard className="p-8 sm:p-12 max-w-md mx-auto">
              <div className="w-48 h-48 mx-auto rounded-2xl bg-gradient-to-br from-warm-100 to-accent-pink-400/10 flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="text-5xl mb-2">📷</div>
                  <p className="text-sm text-stone-400">微信二维码</p>
                </div>
              </div>
              <p className="text-stone-600 font-medium mb-2">微信搜索：VBSite 定制</p>
              <p className="text-stone-400 text-sm">或发送邮件至 hello@vbsite.com</p>
              <div className="mt-8 pt-6 border-t border-white/30">
                <p className="text-stone-400 text-sm mb-3">也可以在这些平台找到我</p>
                <div className="flex justify-center gap-3">
                  {['抖音', '小红书', '闲鱼'].map(p => (
                    <span key={p} className="px-3 py-1.5 rounded-lg bg-white/50 text-stone-500 text-sm">{p}</span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </AnimatedContent>
        </div>
      </section>

      <Footer />
    </div>
  )
}
