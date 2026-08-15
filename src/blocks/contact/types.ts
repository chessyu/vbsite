import { z } from 'zod'

export const socialSchema = z.object({
  icon: z.string(),
  title: z.string(),
  url: z.string().optional(),
  bg: z.string().optional(),
})

export const contactBlockDataSchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  socials: z.array(socialSchema).optional(),
  /** 是否显示 "目前可接项目" 状态指示器 */
  showAvailability: z.boolean().optional(),
})

export type Social = z.infer<typeof socialSchema>
export type ContactBlockData = z.infer<typeof contactBlockDataSchema>
