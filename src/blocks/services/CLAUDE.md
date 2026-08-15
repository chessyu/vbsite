# blocks/services — 服务卡片

服务/能力卡片网格（图标 + 标题 + 描述）。

## 文件

- `ServicesBlock.tsx` — 组件
- `types.ts` — `ServicesBlockData`

## 数据结构

```ts
interface Service { title: string; icon: string; desc: string }
interface ServicesBlockData {
  heading?: string
  subheading?: string
  services: Service[]
}
```

## 动效

- 标题用 `GradientHeading`，卡片用 `AnimatedContent` stagger 入场。
- 通常配 `GlassCard` 容器。

## 约定

- 纯展示型 block，无复杂交互动效。
