# blocks/about — 关于我

头像 + 个人简介 + 技能标签。左右布局（移动端上下）。

## 文件

- `AboutBlock.tsx` — 组件
- `types.ts` — `AboutBlockData`

## 数据结构

```ts
interface AboutBlockData {
  avatar?: string   // 头像（emoji 或图片，缺省占位 📷）
  bio: string       // 自我介绍正文
  tags?: string[]   // 技能/标签药丸
  heading?: string  // 区块标题（缺省「关于我」）
}
```

## 动效

- 头像与正文分别用 `AnimatedContent` 水平方向入场。
- 头像加 `useIdleFloat`（呼吸浮动，仅桌面端）。

## 约定

- 明暗主题通过 `theme` 切换背景渐变与文字色。
