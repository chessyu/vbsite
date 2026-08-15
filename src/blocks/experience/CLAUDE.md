# blocks/experience — 工作经历时间轴

垂直时间轴，逐条展示工作经历（时段/职位/公司/描述）。

## 文件

- `ExperienceBlock.tsx` — 组件
- `types.ts` — `ExperienceBlockData`

## 数据结构

```ts
interface Experience { period: string; role: string; company: string; desc: string }
interface ExperienceBlockData {
  heading?: string        // 缺省「工作经历」
  experiences: Experience[]
}
```

## 动效

- 时间轴中轴线用 `scaleY`（transformOrigin: top）随滚动 `scrub` 绘制。
- 各经历卡片用 `AnimatedContent` 入场。

## 约定

- `scaleY` 绘制仅动 transform，不触发布局（gsap-performance 规范）。
- 从 `@/lib/gsap` import gsap/useGSAP。
