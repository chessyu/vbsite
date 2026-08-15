import { z } from 'zod'

/** 字幕带：绑定一段滚动进度区间 [from, to]（0–1），滚到区间内浮现 */
export const captionSchema = z
  .object({
    text: z.string().min(1),
    /** 滚动进度起点（0–1） */
    from: z.number().min(0).max(1),
    /** 滚动进度终点（0–1），必须大于 from */
    to: z.number().min(0).max(1),
    /** 屏幕位置 */
    position: z.enum(['center', 'left', 'right', 'bottom']).default('center'),
    /** 字号档位 */
    size: z.enum(['lg', 'md', 'sm']).default('lg'),
    /** 胶囊小字（kicker，展示在主文案上方） */
    kicker: z.string().optional(),
  })
  .refine(c => c.to > c.from, { message: '区间终点必须大于起点' })

export const videoSourceSchema = z.object({
  url: z.string().min(1),
  /** 文件字节数（上传时记录；前端据此决定直接 fetch 还是流式下载 + 进度环） */
  bytes: z.number().optional(),
})

export const videoHeroBlockDataSchema = z.object({
  video: videoSourceSchema,
  /** 海报图（静态降级与视频未就绪时的底图） */
  poster: z.string().min(1),
  /** 滚动轨道高度（vh），默认 400 */
  heightVh: z.number().int().min(200).max(800).default(400),
  /** 字幕带 */
  captions: z.array(captionSchema).default([]),
  /** 静态降级 hero 的主标题（电影模式下作为 sr-only h1 保证标题语义） */
  fallbackHeading: z.string().default('标题'),
  /** 静态降级 hero 的副文案 */
  fallbackSub: z.string().default(''),
  /** 结尾静置与降级 hero 共用的 CTA */
  cta: z
    .object({
      label: z.string(),
      href: z.string(),
    })
    .optional(),
  /** 全局色调叠层（rgba 字符串），可选 */
  overlayTint: z.string().optional(),
})

export type Caption = z.infer<typeof captionSchema>
export type VideoSource = z.infer<typeof videoSourceSchema>
export type VideoHeroBlockData = z.infer<typeof videoHeroBlockDataSchema>
