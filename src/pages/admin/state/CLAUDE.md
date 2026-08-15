# src/pages/admin/state/ — 编辑器状态

编辑器的状态层：useReducer 状态机 + Context 分发 + localStorage 草稿持久化。

## 文件

- `editorReducer.ts` — 状态机与 action 定义（INIT / SET_SPACE_META / SET_THEME / SET_PAGE_META / MOVE_BLOCK / ADD_BLOCK / REMOVE_BLOCK / UPDATE_BLOCK_DATA / PUBLISH_* / RESET_TO_SAVED）。含各 block 新增时的默认 data。
- `editorContextTypes.ts` — Context 对象（独立文件，react-refresh 要求组件文件只导出组件）。
- `EditorContext.tsx` — `EditorProvider`（草稿恢复/持久化，key `vbsite:admin:draft:<userId>`）。
- `useEditor.ts` — `useEditor()` hook + `clearDraft()`。

## 约定

- 不引状态库；draft 与 saved 基线分离，dirty = JSON 序列化不等。
- 变更全部走 dispatch action，表单组件不直接改 state。
