import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string(),
  category: z.string(),
  icon: z.string(),
  desc: z.string(),
  wide: z.boolean().optional(),
})

export const galleryBlockDataSchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  projects: z.array(projectSchema),
})

export type Project = z.infer<typeof projectSchema>
export type GalleryBlockData = z.infer<typeof galleryBlockDataSchema>
