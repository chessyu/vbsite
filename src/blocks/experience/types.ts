import { z } from 'zod'

export const experienceSchema = z.object({
  period: z.string(),
  role: z.string(),
  company: z.string(),
  desc: z.string(),
})

export const experienceBlockDataSchema = z.object({
  heading: z.string().optional(),
  experiences: z.array(experienceSchema),
})

export type Experience = z.infer<typeof experienceSchema>
export type ExperienceBlockData = z.infer<typeof experienceBlockDataSchema>
