# src/pages/admin/components/fields/ — 表单原子控件

被所有 block 表单复用的最小控件层，`index.ts` 统一导出。

## 文件

- `TextField.tsx` — `Field`（label 容器）、`TextField`、`TextAreaField`、`ColorField`（取色器+文本）、`SwitchField`、`NumberField`（滑杆）
- `ListEditor.tsx` — 数组字段通用编辑器（增删/上移下移），条目内容由 `renderItem` 决定
- `ImageField.tsx` — 图片上传（`/api/space/:id/assets`）→ 回填绝对路径；会话内用 data URL 预览
- `VideoField.tsx` — 视频上传（ffmpeg.wasm 转码 + 海报提取 + 一次回填 video/poster/bytes，进度条反馈；会话内 blob 预览）。见 `src/lib/admin/videoTranscode.ts`

## 约定

- 统一 stone 色系紧凑风格，不依赖站点视觉体系。
- 控件全部受控（value + onChange），无内部持久状态。
