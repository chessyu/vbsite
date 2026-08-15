# src/ — 源码总览

应用源码根目录。React + Vite + GSAP + React Bits，TS 严格模式，别名 `@` → `src`。

## 入口与路由

- `main.tsx` — React 入口。顶部 `import '@/lib/gsap'` 在路由切换前注册 GSAP 插件。
- `App.tsx` — 路由定义，支持两种模式：
  - 多用户模式（默认）：`/`、`/star`、`/:username`、`/:username/:pageId`、`/admin/*`（lazy）
  - 单用户构建（`VITE_BUILD_USER`）：直接渲染该用户页面

## 模块索引

| 目录 | 职责 | 详见 |
|------|------|------|
| `lib/` | 基础设施（GSAP 统一注册、space.json schema、admin API） | [lib/CLAUDE.md](lib/CLAUDE.md) |
| `hooks/` | 可复用 hook（GSAP 动效、用户配置加载） | [hooks/CLAUDE.md](hooks/CLAUDE.md) |
| `types/` | 全局 TypeScript 类型定义 | [types/CLAUDE.md](types/CLAUDE.md) |
| `data/` | 【预留】静态数据资源 | [data/CLAUDE.md](data/CLAUDE.md) |
| `pages/` | 路由页面组件（含 admin/ 管理后台） | [pages/CLAUDE.md](pages/CLAUDE.md) |
| `components/` | 通用组件（ui / shared / 预留） | [components/CLAUDE.md](components/CLAUDE.md) |
| `blocks/` | 配置驱动的页面区块 | [blocks/CLAUDE.md](blocks/CLAUDE.md) |

## 约定

- **导入别名**：一律用 `@/...` 而非相对路径（`@` → `src`，配置在 `tsconfig.app.json` 与 `vite.config.ts`）。
- **GSAP 插件**：从 `@/lib/gsap` 统一 import，不在组件内重复 `registerPlugin`。
- **新建目录**：必须创建对应 CLAUDE.md（见根目录「目录约定」）。
