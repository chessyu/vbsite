/**
 * space.json 的 zod schema 与校验入口（单一来源：类型由 schema 推导）。
 *
 * 两级校验策略：
 * - 运行时宽松（parseSpaceConfig）：未知 block type 警告 + 跳过，不阻断渲染
 *   （渐进扩展场景：新版配置跑在旧版站点代码上不白屏）。
 * - 构建期严格（parseSpaceConfigStrict）：未知 type / data 不符即失败，
 *   由 generate.cjs 前置调用，把配置错误拦在交付前。
 */
import { z } from 'zod'
// 注意：本模块需同时被 Vite（支持 @ 别名）和 scripts/validate-config.mts（tsx，不支持别名）加载，
// 因此这里统一用相对路径导入。
import { heroBlockDataSchema } from '../blocks/hero/types'
import { aboutBlockDataSchema } from '../blocks/about/types'
import { experienceBlockDataSchema } from '../blocks/experience/types'
import { skillsBlockDataSchema } from '../blocks/skills/types'
import { galleryBlockDataSchema } from '../blocks/gallery/types'
import { featuredProjectBlockDataSchema } from '../blocks/featured-project/types'
import { servicesBlockDataSchema } from '../blocks/services/types'
import { contactBlockDataSchema } from '../blocks/contact/types'

// ---------- 顶层结构 ----------

export const spaceMetaSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  favicon: z.string().optional(),
  footer: z.string().optional(),
})

export const themeConfigSchema = z.object({
  mode: z.enum(['light', 'dark']),
  background: z.string(),
  textColor: z.string(),
  subTextColor: z.string(),
  mutedTextColor: z.string(),
  primaryGradient: z.string(),
  auroraColors: z.array(z.string()).optional(),
})

// ---------- Block 声明 ----------

/** 已注册 block 的 data schema 聚合表 */
export const blockDataSchemas = {
  hero: heroBlockDataSchema,
  about: aboutBlockDataSchema,
  experience: experienceBlockDataSchema,
  skills: skillsBlockDataSchema,
  gallery: galleryBlockDataSchema,
  'featured-project': featuredProjectBlockDataSchema,
  services: servicesBlockDataSchema,
  contact: contactBlockDataSchema,
} as const

export type BlockType = keyof typeof blockDataSchemas

/** block 声明的宽松结构：任意 type 都接受，data 只要求是 object（漏写则补 {}） */
const blockDeclarationLooseSchema = z.object({
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()).default({}),
})

/** 顶层结构校验（block 层单独处理，见 parseSpaceConfig） */
const pageConfigShapeSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  title: z.string(),
  blocks: z.array(blockDeclarationLooseSchema),
})

const spaceConfigShapeSchema = z.object({
  space: spaceMetaSchema,
  theme: themeConfigSchema,
  pages: z.array(pageConfigShapeSchema).min(1),
})

// 推导类型（单一来源，供 @/types/space re-export）
export type SpaceMeta = z.infer<typeof spaceMetaSchema>
export type ThemeConfig = z.infer<typeof themeConfigSchema>
export type BlockDeclaration = z.infer<typeof blockDeclarationLooseSchema>
export type PageConfig = z.infer<typeof pageConfigShapeSchema>
export type SpaceConfig = z.infer<typeof spaceConfigShapeSchema>

// ---------- 错误格式化 ----------

/** 把 zod 错误格式化为 path 化的可读列表，如 `pages/0/blocks/2/data/name: 期望 string` */
function formatIssues(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path.length ? `${issue.path.join('/')}: ` : ''
    return `${path}${issue.message}`
  })
}

// ---------- 运行时宽松校验 ----------

export type SpaceConfigParseResult =
  | { ok: true; config: SpaceConfig; warnings: string[] }
  | { ok: false; issues: string[] }

/**
 * 运行时校验（宽松）：
 * - 顶层结构（space/theme/pages）错误 → 失败
 * - 未知 block type → warning，跳过该 block
 * - 已知 type 但 data 缺 required 字段 → 失败（组件大概率 crash，显式报错好过白屏）
 */
export function parseSpaceConfig(raw: unknown): SpaceConfigParseResult {
  const warnings: string[] = []
  const result = spaceConfigShapeSchema.safeParse(raw)
  if (!result.success) {
    return { ok: false, issues: formatIssues(result.error) }
  }

  const config: SpaceConfig = result.data
  const issues: string[] = []

  config.pages.forEach((page, pi) => {
    page.blocks.forEach((block, bi) => {
      const dataSchema = blockDataSchemas[block.type as BlockType]
      if (!dataSchema) {
        warnings.push(`pages/${pi}/blocks/${bi}: 未知 block type "${block.type}"，已跳过`)
        return
      }
      const dataResult = dataSchema.safeParse(block.data)
      if (!dataResult.success) {
        for (const issue of formatIssues(dataResult.error)) {
          issues.push(`pages/${pi}/blocks/${bi}/data/${issue}`)
        }
      }
    })
  })

  // 过滤掉未知 type 的 block（跳过而非渲染）
  if (warnings.length) {
    config.pages = config.pages.map(page => ({
      ...page,
      blocks: page.blocks.filter(b => blockDataSchemas[b.type as BlockType] !== undefined),
    }))
  }

  if (issues.length) {
    return { ok: false, issues }
  }
  return { ok: true, config, warnings }
}

// ---------- 构建期严格校验 ----------

/**
 * 构建期校验（严格）：未知 block type 也视为错误。
 * 供 generate.cjs 在 vite build 前调用，失败即退出。
 */
export function parseSpaceConfigStrict(raw: unknown): SpaceConfigParseResult {
  const loose = parseSpaceConfig(raw)
  if (!loose.ok) return loose
  // 宽松校验通过后，warnings 里只可能是未知 type
  if (loose.warnings.length) {
    return { ok: false, issues: loose.warnings }
  }
  return { ok: true, config: loose.config, warnings: [] }
}
