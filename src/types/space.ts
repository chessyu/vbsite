/**
 * 用户空间配置类型层 —— 全部由 `@/lib/spaceSchema` 的 zod schema 推导并 re-export。
 * 修改字段请改 schema（单一来源），不要在此手写 interface。
 */
export type {
  SpaceConfig,
  SpaceMeta,
  ThemeConfig,
  PageConfig,
  BlockDeclaration,
  BlockType,
} from '@/lib/spaceSchema'
