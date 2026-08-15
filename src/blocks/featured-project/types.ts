import { z } from 'zod'

export const featuredProjectBlockDataSchema = z.object({
  heading: z.string().optional(),
  project: z.object({
    title: z.string(),
    desc: z.string(),
    tags: z.array(z.string()),
    icon: z.string().optional(),
  }),
})

export type FeaturedProjectBlockData = z.infer<typeof featuredProjectBlockDataSchema>
