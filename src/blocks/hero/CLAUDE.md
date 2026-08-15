# blocks/hero — 英雄区

页面首屏：全屏布局、clamp 大字号渐变标题（行遮罩揭示）、多层背景（Aurora + 光晕 + 网格）、滚动视差与淡出。

## 文件

- `HeroBlock.tsx` — 组件（内含 `HeroBackdrop` 多层背景子组件）
- `types.ts` — `HeroBlockData`（zod schema 单一来源）

## 数据结构

```ts
interface HeroBlockData {
  name: string           // 大标题（人名/品牌名）
  title: string          // 副头衔（职业/角色）
  tagline?: string       // 描述文案
  subtitle?: string      // 名字上方小字（逐字入场，建议大写英文 + 宽字距）
  cta?: { label: string; href: string }[]  // 行动按钮（胶囊形，首按钮磁吸 + 光晕）
  useAurora?: boolean    // 是否启用极光背景
}
```

## 视觉

- **主标题**：`text-[clamp(3.5rem,10vw,9rem)] leading-[0.95] font-display`，`bg-clip-text` 渐变字（明暗主题两套 warm→accent-pink 渐变）。
- **多层背景**（`HeroBackdrop`，全静态 CSS 无降级问题）：Aurora（可选）+ 双径向光晕 + 网格纹理（60px，`mask-image` 径向遮罩只在中心显影）。浅色主题：光晕透明度减半、网格线深色 + 白色雾化层压脏感。
- **CTA**：`rounded-full` 胶囊；主按钮 hover 光晕 `shadow-[0_0_40px_rgba(245,158,11,0.4)]`。
- **底部滚动提示**：竖线内滑动光点（CSS keyframes `scroll-hint`，reduce 档禁用）。

## 动效

- **主标题**：`SplitText` `splitType="lines" mask="lines"` 行遮罩揭示（`yPercent: 110 → 0`，`power4.out`）。
- **subtitle**：`SplitText` 逐字入场（chars）。
- **副标题/tagline/CTA**：`AnimatedContent` 分层延迟入场。
- **视差**：背景 `useParallax(0.15)`、内容 `useParallax(-0.1)` 反向（hook 内三档降级）。
- **滚动淡出**：内容 `y:-80, autoAlpha:0.1` + `scrub:1`（不 pin——pin-spacer 有文档流坑，通用 block 不冒险），仅 isDesktop。
- 首个 CTA 加 `useMagnetic` 磁吸。

## 约定

- 通过 `theme.mode`/`theme.textColor` 等适配明暗主题。
- 通常作为页面第一个 block（`index: 0`）。
