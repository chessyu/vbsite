# blocks/gallery — 作品画廊

响应式网格展示作品，支持 wide（跨格）大图。双形态卡面：有图真图展示，无图渐变降级。核心交互：3D 倾斜 + 滚动视差。

## 文件

- `GalleryBlock.tsx` — 组件（内含 `ProjectCard` 子组件：单卡双形态渲染）
- `types.ts` — `GalleryBlockData`（zod schema 单一来源）

## 数据结构

```ts
interface Project {
  title: string
  category: string
  image?: string    // 作品图（如 "/users/cheesyu/images/x.jpg"）。有图优先
  icon?: string     // emoji（无图降级形态使用；icon 也缺时用 category 首字符）
  desc: string
  tags?: string[]   // 标签药丸（wide 卡最多 6 个，普通卡 4 个）
  wide?: boolean
}
interface GalleryBlockData {
  heading?: string    // 缺省「精选作品」
  subheading?: string
  projects: Project[]
}
```

**图片路径约定**：图片文件放 `public/users/<username>/images/`，space.json 引用写绝对路径 `/users/<username>/images/xxx.jpg`（相对路径在子路径页面 `/cheesyu/products` 下会解析错）。dev 由 `public/` 静态服务；generate 产物中随 `public/` 拷贝。

## 卡面双形态

- **有图**：`object-cover` + CSS `group-hover:scale-105` + 常驻底部 `from-black/70` 渐变保证文字可读；`img onError` 自动回退无图形态。
- **无图降级**：渐变卡面（`from-warm-500/90 via-accent-pink-500/60 to-violet-500/90`）+ 径向高光 + 大 emoji + 右上角 `font-display` 装饰序号（01/02…）。
- hover 遮罩展示 desc 详情。

## 动效（仅桌面端，`gsap.matchMedia` 三档降级）

- **3D 倾斜**：每张卡（`[data-tilt]`）mousemove 时 `quickTo` rotationX/rotationY（±10°）/scale（1.02），mouseleave 回弹。`transformPerspective: 1000`。
- **滚动视差**：每张卡按 `index % 3` 循环 speed `[0.15, 0.25, 0.1]`，ScrollTrigger `scrub:1` 驱动 y，形成前后层次。
- 入场用 `AnimatedContent`（per-card stagger）。

**transform 分层管理**：hover scale 走 CSS transition、tilt/视差走 GSAP——两者互不覆盖。

## 约定

- `wide` 卡占 `sm:col-span-2 lg:row-span-2`，更大最小高度（400px）。
- 无图渐变按 `index % 3` 循环三套配色。
- 卡片纯展示（无 cursor-pointer），lightbox 为二期规划（`components/ui/Lightbox.tsx`）。
- 从 `@/lib/gsap` import，不在组件内自行 register。
