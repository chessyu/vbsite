# src/components/landing/ — 【预留】落地页专用组件

> **状态：预留目录**，当前为空。

## 规划用途

VBSite 官方落地页（`src/pages/LandingPage.tsx`）专用、且不适合下沉到 block 体系的组件。

目前落地页内容直接写在 `LandingPage.tsx`（Hero / 优势 / Demo / 定价 / 联系）。当某个区域变得复杂、需要独立组件时，再迁入本目录，例如：

- 定价方案对比表
- Demo 预览卡片
- 落地页专属 CTA 组

## 约定

- 仅落地页使用的组件放这里；跨页面复用的放 `shared/`。
- 业务无关视觉原子放 `ui/`。
