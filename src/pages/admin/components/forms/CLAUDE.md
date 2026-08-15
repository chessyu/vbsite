# src/pages/admin/components/forms/ — Block 编辑表单

每个 block 类型一个手写表单，`index.ts` 的 `formRegistry` 注册（仿 `blocks/registry.ts` 模式，`defineForm` 受控类型擦除）。

## 文件

`HeroForm / AboutForm / ExperienceForm / SkillsForm / GalleryForm / FeaturedProjectForm / ServicesForm / ContactForm` + `index.ts`（注册表 + `blockTypeLabels` 中文标签）。

## 约定

- 公共 props：`{ data, userId, token, onChange }`（见 `BlockFormProps`）。`onChange(updater)` 接收 `(data) => newData` 形式的更新函数。
- 需要图片上传的表单（About/Gallery）用 `fields/ImageField`（传 userId + token）。
- 数组字段（experiences/projects/skills/services/socials/cta）统一用 `fields/ListEditor`。
- schema 校验发生在发布时（`parseSpaceConfigStrict`），表单内不做重复校验。
