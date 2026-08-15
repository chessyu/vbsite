# src/components/ui/ — 动效/视觉原子组件

与业务无关的视觉与动效原子组件，可被任意页面/block 复用。多数基于 GSAP 或 WebGL（OGL）。

## 文件

**GSAP 动效**
- `AnimatedContent.tsx` — 全站统一入场动画容器。`useGSAP`+scope，支持 stagger，**三档 matchMedia 降级**（isDesktop 全特效 / isMobile 参数减半 / reduce 直接终态）。首屏可见直接播放，折叠区挂 ScrollTrigger。
- `SplitText.tsx` — GSAP SplitText 封装。支持 chars/words/lines 分割，等 `document.fonts.ready` 后再 split 避免错位，ScrollTrigger 触发。

**稳定性**
- `ErrorBoundary.tsx` — React class 错误边界。App 级（`main.tsx` 最外层，全屏降级 + 刷新按钮）与 Block 级（`BlockRenderer` 内，占位降级 section，跟随 theme）双形态。降级 UI 不用 GSAP。

**视觉/WebGL**
- `Aurora.tsx` — OGL WebGL 极光背景（GLSL 着色器，色值/振幅/混合度可配）。
- `Particles.tsx` — OGL 3D 粒子系统（鼠标跟随）。
- `CursorGlow.tsx` — 桌面端光标光斑。`quickTo` 跟随 + hover 放大；仅桌面渲染（matchMedia 检测 hover/pointer），支持 `dark` prop。
- `GradientText.tsx` — CSS 渐变文字（动画背景位置）。

**待清理**
- `BlurText.tsx` — 基于 motion 的文字模糊动画。落地页/作品集 Hero 已统一改用 GSAP `SplitText`，本组件目前**无引用**，确认无其他依赖后可删除。

## 约定

- 组件保持**业务无关**：通过 props 接收配置，不直接读取 theme/space 配置。
- GSAP 组件从 `@/lib/gsap` import。
- 尊重 `prefers-reduced-motion`（AnimatedContent / CursorGlow 已内置三档降级）。
