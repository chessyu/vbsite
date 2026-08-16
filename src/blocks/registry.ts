import type { BlockDefinition } from './types'
import { HeroBlockComponent } from './hero/HeroBlock'
import { VideoHeroBlockComponent } from './video-hero/VideoHeroBlock'
import { AboutBlockComponent } from './about/AboutBlock'
import { ExperienceBlockComponent } from './experience/ExperienceBlock'
import { SkillsBlockComponent } from './skills/SkillsBlock'
import { GalleryBlockComponent } from './gallery/GalleryBlock'
import { FeaturedProjectBlockComponent } from './featured-project/FeaturedProjectBlock'
import { ServicesBlockComponent } from './services/ServicesBlock'
import { ContactBlockComponent } from './contact/ContactBlock'
import { heroBlockDataSchema } from './hero/types'
import { videoHeroBlockDataSchema } from './video-hero/types'
import { aboutBlockDataSchema } from './about/types'
import { experienceBlockDataSchema } from './experience/types'
import { skillsBlockDataSchema } from './skills/types'
import { galleryBlockDataSchema } from './gallery/types'
import { featuredProjectBlockDataSchema } from './featured-project/types'
import { servicesBlockDataSchema } from './services/types'
import { contactBlockDataSchema } from './contact/types'

/**
 * 注册辅助函数：唯一的受控类型擦除点。
 *
 * 契约：异构泛型（BlockDefinition<TData>）放进同一注册表必然类型擦除，
 * 安全性由「data 经 spaceSchema 校验后才到达组件」这一链路保证（见 lib/spaceSchema.ts）。
 * component 与 schema 的 TData 不一致时在此处立即编译报错（编译期闭环）。
 */
function defineBlock<TData>(def: BlockDefinition<TData>): BlockDefinition<unknown> {
  return def as BlockDefinition<unknown>
}

const allBlocks: BlockDefinition<unknown>[] = [
  defineBlock({ type: 'hero', component: HeroBlockComponent, schema: heroBlockDataSchema }),
  defineBlock({ type: 'video-hero', component: VideoHeroBlockComponent, schema: videoHeroBlockDataSchema }),
  defineBlock({ type: 'about', component: AboutBlockComponent, schema: aboutBlockDataSchema }),
  defineBlock({ type: 'experience', component: ExperienceBlockComponent, schema: experienceBlockDataSchema }),
  defineBlock({ type: 'skills', component: SkillsBlockComponent, schema: skillsBlockDataSchema }),
  defineBlock({ type: 'gallery', component: GalleryBlockComponent, schema: galleryBlockDataSchema }),
  defineBlock({ type: 'featured-project', component: FeaturedProjectBlockComponent, schema: featuredProjectBlockDataSchema }),
  defineBlock({ type: 'services', component: ServicesBlockComponent, schema: servicesBlockDataSchema }),
  defineBlock({ type: 'contact', component: ContactBlockComponent, schema: contactBlockDataSchema }),
]

const blockRegistry = new Map<string, BlockDefinition<unknown>>()
allBlocks.forEach(block => blockRegistry.set(block.type, block))

/** 根据 type 查找 Block 定义 */
export function getBlock(type: string): BlockDefinition<unknown> | undefined {
  return blockRegistry.get(type)
}

/** 获取所有已注册 Block 的 type 列表 */
export function getRegisteredBlockTypes(): string[] {
  return Array.from(blockRegistry.keys())
}
