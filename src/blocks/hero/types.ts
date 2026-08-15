import { z } from 'zod'

export const heroCtaSchema = z.object({
  label: z.string(),
  href: z.string(),
})

export const heroBlockDataSchema = z.object({
  name: z.string(),
  title: z.string(),
  tagline: z.string().optional(),
  /** 副标题（暗色主题下的角色描述，显示在名字上方） */
  subtitle: z.string().optional(),
  /** CTA 按钮 */
  cta: z.array(heroCtaSchema).optional(),
  /** 是否使用 Aurora 背景（暗色主题适用） */
  useAurora: z.boolean().optional(),
})

export type HeroBlockData = z.infer<typeof heroBlockDataSchema>
