# src/blocks/ — 配置驱动的页面区块

VBSite 的核心渲染单元。每个 block 是一段独立的页面区块（hero、gallery 等），由客户配置 `space.json` 中的 `blocks[]` 声明驱动，`BlockRenderer` 按 `type` 动态渲染。

## 核心机制

- **注册表**：`registry.ts` 维护 `type → { component, schema }` 映射，用 `defineBlock()` 注册（component 与 schema 的类型不一致会编译报错）。新增 block 必须在此注册。
- **渲染器**：`BlockRenderer.tsx` 接收 `{ declaration, theme, index }`，查表渲染对应组件；每个 block 外包 `ui/ErrorBoundary`（block 级），单个 block 崩溃不拖垮整页。
- **统一 Props**：所有 block 组件实现 `BlockProps<T>`（见 `types.ts`）：`data`（业务数据）、`theme`（全局主题）、`index`（位置索引，用于动画延迟）。
- **数据校验**：`<type>/types.ts` 用 zod schema 定义 data 结构（`z.infer` 推导类型），schema 同时被 `lib/spaceSchema.ts` 聚合用于 space.json 校验。

```ts
interface BlockProps<T> { data: T; theme: ThemeConfig; index: number }
```

## Block 清单

| type | 职责 | 数据类型 |
|------|------|---------|
| `hero` | 首屏英雄区（名字/头衔/CTA） | [hero/CLAUDE.md](hero/CLAUDE.md) |
| `about` | 关于我（头像/简介/标签） | [about/CLAUDE.md](about/CLAUDE.md) |
| `experience` | 工作经历时间轴 | [experience/CLAUDE.md](experience/CLAUDE.md) |
| `skills` | 技能进度条 | [skills/CLAUDE.md](skills/CLAUDE.md) |
| `gallery` | 作品画廊（3D 倾斜 + 视差） | [gallery/CLAUDE.md](gallery/CLAUDE.md) |
| `featured-project` | 深度案例展示 | [featured-project/CLAUDE.md](featured-project/CLAUDE.md) |
| `services` | 服务卡片 | [services/CLAUDE.md](services/CLAUDE.md) |
| `contact` | 联系方式 | [contact/CLAUDE.md](contact/CLAUDE.md) |

## 新增 Block 的步骤

1. 建子目录 `<type>/`，含 `<Type>Block.tsx`（组件）和 `types.ts`（zod schema + `z.infer` 导出 `<Type>BlockData`）。
2. 组件导出 `<Type>BlockComponent`，签名 `(props: BlockProps<<Type>BlockData>) => JSX`。
3. 在 `registry.ts` 的 `allBlocks` 用 `defineBlock({ type: '<type>', component, schema })` 注册。
4. 在 `lib/spaceSchema.ts` 的 `blockDataSchemas` 表中加入该 schema（否则构建期严格校验会报未知 type）。
5. 在本目录建 `CLAUDE.md`（见根目录「目录约定」）。
6. 客户 `space.json` 即可用 `{ "type": "<type>", "data": {...} }` 引用。

## 约定

- block 组件**只渲染自身**，不感知页面其它 block 或路由。
- 入场动画统一用 `ui/AnimatedContent`；滚动驱动用 `useParallax`/ScrollTrigger；GSAP 从 `@/lib/gsap` import。
- 业务无关视觉元素复用 `components/ui`、`components/shared`。
