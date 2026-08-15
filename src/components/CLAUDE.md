# src/components/ — 通用组件

跨页面、跨 block 复用的 React 组件。按抽象层级分子目录。

## 文件

- `RootRedirect.tsx` — 根路由重定向逻辑：记录/读取「最近访问用户」（localStorage），`/` 有记录则跳转该用户空间，否则显示落地页。

## 子目录

| 目录 | 职责 | 详见 |
|------|------|------|
| `ui/` | 动效/视觉原子组件（GSAP、WebGL，与业务无关） | [ui/CLAUDE.md](ui/CLAUDE.md) |
| `shared/` | 跨页面共享的业务组件（Footer、卡片、标题） | [shared/CLAUDE.md](shared/CLAUDE.md) |
| `landing/` | 【预留】落地页专用组件 | [landing/CLAUDE.md](landing/CLAUDE.md) |
| `portfolio/` | 【预留】作品集专用组件 | [portfolio/CLAUDE.md](portfolio/CLAUDE.md) |
| `resume/` | 【预留】简历专用组件 | [resume/CLAUDE.md](resume/CLAUDE.md) |

## 分层约定

- **`ui/`** = 与业务无关的原子能力（动效容器、文字动画、WebGL 背景），可被任意页面/block 复用。
- **`shared/`** = 业务级共享件（如 GlassCard、Footer），有产品语义但不绑定单一页面。
- **`landing|portfolio|resume/`** = 单一场景专用组件（预留）。

不要把「只用一次」的组件放进 `ui/` 或 `shared/`；放对应场景目录或就近放使用方。
