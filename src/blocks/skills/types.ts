import { z } from 'zod'

export const skillSchema = z.object({
  name: z.string(),
  level: z.number(),
  icon: z.string(),
  color: z.string(),
})

export const skillsBlockDataSchema = z.object({
  heading: z.string().optional(),
  skills: z.array(skillSchema),
})

export type Skill = z.infer<typeof skillSchema>
export type SkillsBlockData = z.infer<typeof skillsBlockDataSchema>
