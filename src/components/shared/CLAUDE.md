# src/components/shared/ — 跨页面共享业务组件

有产品语义、被多个页面/block 复用的业务组件。

## 文件

- `GlassCard.tsx` — 毛玻璃卡片容器。支持明/暗主题（`dark` prop）。
- `GradientHeading.tsx` — 渐变色标题（warm→accent-pink）。
- `Footer.tsx` — 页脚。`dark` prop 切换主题，`text` prop 自定义文案。

## 约定

- 组件接收 props 驱动样式（如 `dark`、`text`、`className`），不硬编码单一主题。
- 与单一页面强绑定的组件不放这里（放对应场景目录）。
- 与业务无关的原子组件放 `ui/`。
