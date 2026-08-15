# blocks/skills — 技能进度条

技能名 + 图标 + 水平进度条，按熟练度（level 0–100）填充。

## 文件

- `SkillsBlock.tsx` — 组件
- `types.ts` — `SkillsBlockData`

## 数据结构

```ts
interface Skill { name: string; level: number; icon: string; color: string /* tailwind 渐变类 */ }
interface SkillsBlockData {
  heading?: string   // 缺省「专业技能」
  skills: Skill[]
}
```

## 动效

- 进度条用 `scaleX`（transformOrigin: left）按 `level/100` 填充，ScrollTrigger `top 85%` 触发。
- 技能图标（`[data-skill-icon]`）桌面端 yoyo 呼吸浮动，离屏暂停。

## 约定

- `scaleX` 替代 `width`，避免 layout 抖动。
- 进度条色用内联渐变 `#f59e0b → #ec4899`；图标背景色用 `skill.color`（tailwind 类）。
