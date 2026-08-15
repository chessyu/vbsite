# src/types/ — 全局类型定义

跨模块共享的 TypeScript 类型定义。

## 文件

- `space.ts` — 用户空间配置类型的 **re-export 层**，全部来自 `@/lib/spaceSchema` 的 zod schema 推导：
  - `SpaceConfig` — 顶层配置（`space` 元信息 + `theme` 主题 + `pages[]` 页面）
  - `ThemeConfig` — 主题（mode / 色值 / 渐变 / aurora 颜色）
  - `PageConfig` — 单个页面（id / path / title / blocks[]）
  - `BlockDeclaration` — block 声明（`type` + `data`）
  - `BlockType` — 已注册 block type 的字符串字面量联合

## 与其它模块的关系

- **单一来源在 `src/lib/spaceSchema.ts`**（zod schema + `z.infer`）。修改字段请改 schema，不要在此手写 interface。
- `users/<客户名>/space.json` 的结构对应 `SpaceConfig`。
- `src/blocks/BlockRenderer.tsx` 按 `BlockDeclaration.type` 查找渲染组件。
- 各 block 的专属数据类型（如 `HeroBlockData`）定义在各自目录的 `types.ts`（同为 zod schema 推导），不放这里。

## 约定

- 仅放**全局共享**的类型。单个模块私有的类型留在该模块目录（如 `blocks/hero/types.ts`）。
- 用 `import type` 引入。
