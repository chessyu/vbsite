# src/pages/ — 路由页面

React Router 的页面级组件（每个对应一条路由）。

## 文件

- `LandingPage.tsx` — VBSite 官方落地页（多用户模式的 `/`）。含 Hero / 优势 / Demo / 定价 / 联系。GSAP 高质感动效主战场：SplitText 标题、磁吸 CTA、CursorGlow、视差。
- `UserSpacePage.tsx` — 多用户模式用户空间（`/:username`、`/:username/:pageId`）。用 `useSpaceConfig` 加载配置，遍历 blocks 渲染。
- `SingleUserSpacePage.tsx` — 单用户构建模式页面（`VITE_BUILD_USER`）。接收已注入的 config 直接渲染。

## 渲染流程

```
useSpaceConfig(username) → config → config.pages[id].blocks → BlockRenderer 逐个渲染
```

## 约定

- 页面组件默认导出（`export default`），与路由配置一致。
- 页面只做「编排」：加载配置、布局、接入顶层组件（CursorGlow、Footer）；具体内容下沉到 `blocks/` 或 `components/`。
- 单用户 / 多用户两种模式的差异在此目录收敛，blocks 与 components 保持模式无关。
