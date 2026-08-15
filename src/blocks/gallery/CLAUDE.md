# blocks/gallery — 作品画廊

响应式网格展示作品，支持 wide（跨格）大图。核心交互：3D 倾斜 + 滚动视差。

## 文件

- `GalleryBlock.tsx` — 组件
- `types.ts` — `GalleryBlockData`

## 数据结构

```ts
interface Project { title: string; category: string; icon: string; desc: string; wide?: boolean }
interface GalleryBlockData {
  heading?: string    // 缺省「精选作品」
  subheading?: string
  projects: Project[]
}
```

## 动效（仅桌面端，`gsap.matchMedia` 三档降级）

- **3D 倾斜**：每张卡（`[data-tilt]`）mousemove 时 `quickTo` rotationX/rotationY/scale，mouseleave 回弹。`transformPerspective: 1000`。
- **滚动视差**：每张卡按 `index % 3` 循环 speed `[0.15, 0.25, 0.1]`，ScrollTrigger `scrub:1` 驱动 y，形成前后层次。
- 入场用 `AnimatedContent`（per-card stagger）。

视差与 tilt 都只动 transform、由 GSAP 统一管理顺序，互不干扰。

## 约定

- `wide` 卡占 `sm:col-span-2 lg:row-span-2`，更大最小高度。
- 渐变背景按 `index % 3` 循环三套配色。
- 从 `@/lib/gsap` import，不在组件内自行 register。
