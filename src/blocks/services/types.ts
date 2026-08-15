import { z } from 'zod'

export const serviceSchema = z.object({
  title: z.string(),
  icon: z.string(),
  desc: z.string(),
})

export const servicesBlockDataSchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  services: z.array(serviceSchema),
})

export type Service = z.infer<typeof serviceSchema>
export type ServicesBlockData = z.infer<typeof servicesBlockDataSchema>
