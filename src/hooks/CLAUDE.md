# src/hooks/ — 可复用 Hook

跨组件复用的 React hooks。分两类：GSAP 动效 hook 与业务 hook。

## GSAP 动效 hook（统一三档 matchMedia 降级）

| Hook | 作用 | 关键实现 |
|------|------|---------|
| `useMagnetic` | 磁吸按钮：鼠标靠近时元素被吸引偏移 | `quickTo` x/y + window mousemove，仅 isDesktop |
| `useParallax` | 滚动视差：ScrollTrigger scrub 驱动 y 位移 | `scrub:1`，函数式 y 值，仅 isDesktop |
| `useIdleFloat` | 呼吸浮动：yoyo 无限 y 往返 | `onToggle` 离屏暂停，仅 isDesktop |

**三档降级**（每个 hook 内部 `gsap.matchMedia` 自行处理）：`isDesktop`(≥768px 且 no-preference) 全特效；`isMobile`(<768px) 跳过；`reduce` 跳过。组件层无需重复判断。

**统一约定**：用 `useGSAP` + `scope` ref + `contextSafe`；仅动 `transform`/`autoAlpha`；高频交互用 `quickTo`。

## 业务 hook

- `useSpaceConfig(username)` — 加载用户空间配置并经 `parseSpaceConfig` 校验（见 `lib/spaceSchema.ts`）。支持构建时注入（`VITE_BUILD_USER` 模式 `import.meta.env`）或运行时 `fetch('/users/<username>/space.json')`。返回 `{ config, loading, error }`，其中 `error` 是判别联合 `SpaceConfigError`：
  - `not-found` → 用户空间不存在（消费方应重定向）
  - `network` → fetch / JSON 解析失败
  - `invalid-config` → schema 校验失败（含 path 化 `issues` 列表，消费方应显示错误页而非重定向）
  - `parse-build` → 构建时注入数据损坏

## 约定

- 命名 `useXxx`，一个文件一个 hook。
- GSAP hook 必须从 `@/lib/gsap` import。
- 与单一组件强耦合的动画逻辑，直接写在该组件的 `useGSAP` 内，不必抽 hook。
