# src/lib/ — 基础设施

跨模块共享的底层基础设施（无 React 依赖）。GSAP 注册入口 + space.json 校验 schema。

## 文件

- `gsap.ts` — **全站唯一 GSAP 插件注册入口**。集中 `registerPlugin(ScrollTrigger, SplitText, Observer, useGSAP)`，导出 `gsap` 及各插件。利用 registerPlugin 幂等性，重复 import 无副作用。
- `spaceSchema.ts` — **space.json 的 zod schema 单一来源**。聚合各 block 的 data schema，提供两级校验：
  - `parseSpaceConfig`（运行时宽松）：未知 block type 警告 + 跳过，不阻断渲染
  - `parseSpaceConfigStrict`（构建期严格）：未知 type 也报错，供 `scripts/validate-config.mts` 使用
  - `SpaceConfig` 等类型由 schema `z.infer` 推导，`@/types/space` 只是 re-export 层
  - 注意：本模块需同时被 Vite 与 tsx（node）加载，**用相对路径 import**，不用 `@/` 别名

## 用法

```ts
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
```

任何用到 GSAP 的组件都从这里 import，**禁止**再从 `gsap`、`gsap/ScrollTrigger` 直接 import 并自行 register。

`main.tsx` 顶部 `import '@/lib/gsap'` 保证路由切换前插件已注册（覆盖懒加载场景）。

## 为什么不用 React Context

插件注册是全局副作用，与渲染树无关；纯模块级注册比 Provider 轻量，且 StrictMode 双渲染天然兼容。

## 约定

- 仅放「无 React 依赖的纯基础设施」。带 React hooks 的复用逻辑放 `src/hooks/`。
- 新增 GSAP 插件在此统一注册后导出。
