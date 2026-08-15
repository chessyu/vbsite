import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string(),
  category: z.string(),
  /** 作品图片路径（如 "users/cheesyu/images/x.jpg"）。缺省时降级为渐变卡面 + icon */
  image: z.string().optional(),
  /** emoji 图标（无图降级形态使用；image 优先） */
  icon: z.string().optional(),
  desc: z.string(),
  /** 标签药丸（wide 卡最多展示 6 个，普通卡 4 个） */
  tags: z.array(z.string()).optional(),
  wide: z.boolean().optional(),
})

export const galleryBlockDataSchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  projects: z.array(projectSchema),
})

export type Project = z.infer<typeof projectSchema>
export type GalleryBlockData = z.infer<typeof galleryBlockDataSchema>
