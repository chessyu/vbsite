import type { ComponentType } from 'react'
import type { BlockType } from '@/lib/spaceSchema'
import { HeroForm } from './HeroForm'
import { VideoHeroForm } from './VideoHeroForm'
import { AboutForm } from './AboutForm'
import { ExperienceForm } from './ExperienceForm'
import { SkillsForm } from './SkillsForm'
import { GalleryForm } from './GalleryForm'
import { FeaturedProjectForm } from './FeaturedProjectForm'
import { ServicesForm } from './ServicesForm'
import { ContactForm } from './ContactForm'

/** block 表单的公共 props：编辑上下文 + 更新回调 */
export interface BlockFormProps<TData = Record<string, unknown>> {
  data: TData
  userId: string
  token: string
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}

/**
 * 受控类型擦除点（仿 blocks/registry.ts 的 defineBlock 契约）：
 * 异构 data 类型的表单放进同一注册表必然类型擦除，
 * 安全性由「data 从编辑器 draft 直接传来、发布前经 spaceSchema 严格校验」保证。
 */
function defineForm(component: unknown): ComponentType<BlockFormProps> {
  return component as ComponentType<BlockFormProps>
}

/** type → 表单组件注册表（仿 blocks/registry.ts 模式） */
export const formRegistry: { [K in BlockType]: ComponentType<BlockFormProps> } = {
  hero: defineForm(HeroForm),
  'video-hero': defineForm(VideoHeroForm),
  about: defineForm(AboutForm),
  experience: defineForm(ExperienceForm),
  skills: defineForm(SkillsForm),
  gallery: defineForm(GalleryForm),
  'featured-project': defineForm(FeaturedProjectForm),
  services: defineForm(ServicesForm),
  contact: defineForm(ContactForm),
}

export const blockTypeLabels: Record<BlockType, string> = {
  hero: '首屏 Hero',
  'video-hero': '视频首屏（电影感滚动）',
  about: '关于我',
  experience: '工作经历',
  skills: '技能',
  gallery: '作品画廊',
  'featured-project': '深度案例',
  services: '服务卡片',
  contact: '联系方式',
}
