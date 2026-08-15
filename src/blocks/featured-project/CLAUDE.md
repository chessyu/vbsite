# blocks/featured-project — 深度案例

单个重点项目的图文展示：大视觉 + 标题/描述/标签，左右布局。

## 文件

- `FeaturedProjectBlock.tsx` — 组件
- `types.ts` — `FeaturedProjectBlockData`

## 数据结构

```ts
interface FeaturedProjectBlockData {
  heading?: string   // 缺省「深度案例」
  project: {
    title: string
    desc: string
    tags: string[]
    icon?: string    // 缺省 🚀
  }
}
```

## 动效

- 视觉大图与文字两侧分别 `AnimatedContent` 水平入场（左右对开）。
- 大图加 `useParallax`（speed 0.2，仅桌面端）。

## 约定

- 视差 ref 加在大图内层 div（与入场容器不同元素，避免 transform 冲突）。
