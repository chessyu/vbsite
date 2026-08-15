# blocks/hero — 英雄区

页面首屏：大字号名字 + 头衔 + 可选 CTA。占满首屏，含 Aurora 背景。

## 文件

- `HeroBlock.tsx` — 组件
- `types.ts` — `HeroBlockData`

## 数据结构

```ts
interface HeroBlockData {
  name: string           // 大标题（人名/品牌名）
  title: string          // 副头衔（职业/角色）
  tagline?: string       // 描述文案
  subtitle?: string      // 名字上方的小字
  cta?: { label: string; href: string }[]  // 行动按钮
  useAurora?: boolean    // 是否启用极光背景（暗色主题适用）
}
```

## 动效

- 名字用 `SplitText` 分行入场（浅/暗主题统一 GSAP，替代旧的 BlurText）。
- 副标题/tagline/CTA 用 `AnimatedContent` 按 `index * 150` 节奏延迟入场。
- 首个 CTA 加 `useMagnetic` 磁吸。

## 约定

- 通过 `theme.mode`/`theme.textColor` 等适配明暗主题。
- 通常作为页面第一个 block（`index: 0`）。
