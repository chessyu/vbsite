# blocks/contact — 联系方式

联系入口：邮箱 / 电话 / 社交链接，可选「目前可接项目」状态指示。

## 文件

- `ContactBlock.tsx` — 组件
- `types.ts` — `ContactBlockData`

## 数据结构

```ts
interface Social { icon: string; title: string; url?: string; bg?: string /* hover 背景类 */ }
interface ContactBlockData {
  heading?: string       // 缺省「与我联系」/暗色 "Let's Work Together"
  subheading?: string
  email?: string
  phone?: string
  socials?: Social[]
  showAvailability?: boolean  // 显示绿色「目前可接项目」脉冲指示
}
```

## 动效

- 标题用 `SplitText` 分行入场。
- 联系卡片用 `AnimatedContent`（scale 0.95）入场。

## 约定

- 邮箱/电话分别 `mailto:` / `tel:` 链接。
- 明暗主题适配（暗色用 `glass-card-dark`）。
