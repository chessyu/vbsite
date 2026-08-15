import { z } from 'zod'

export const aboutBlockDataSchema = z.object({
  avatar: z.string().optional(),
  bio: z.string(),
  tags: z.array(z.string()).optional(),
  heading: z.string().optional(),
})

export type AboutBlockData = z.infer<typeof aboutBlockDataSchema>
