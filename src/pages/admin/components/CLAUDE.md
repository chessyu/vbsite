# src/pages/admin/components/ — 编辑器 UI 组件

编辑器左侧面板与预览容器的实现组件（页面级组件在上级目录）。

## 文件

| 文件 | 职责 |
|---|---|
| `SpaceMetaForm.tsx` | 空间元信息（username 只读/displayName/footer） |
| `ThemeForm.tsx` | 主题（明暗/背景/文字色/渐变/极光色） |
| `PageStructureForm.tsx` | block 列表（增删排序）+ 选中 block 的表单挂载 |
| `PreviewFrame.tsx` | iframe 容器：postMessage 推 config + 桌面/移动视口切换 |

## 子目录

- `forms/` — 8 个 block 手写表单 + `formRegistry` 注册表（type → 表单组件）。
- `fields/` — 表单原子控件（TextField/TextAreaField/ColorField/SwitchField/NumberField/ListEditor/ImageField），所有表单复用。

## 约定

- 表单不直接改 state，统一通过 `useEditor().dispatch(UPDATE_BLOCK_DATA)`。
- 新增 block 类型时：建 `forms/<Type>Form.tsx` + 在 `forms/index.ts` 注册 + 在 `editorReducer.ts` 的 `defaultBlockData` 补默认值。
