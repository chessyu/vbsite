import type { ThemeConfig } from '@/types/space'
import type { ComponentType } from 'react'
import type { ZodType } from 'zod'

/** Block 注册表中的定义 */
export interface BlockDefinition<T = unknown> {
  /** Block 唯一标识，如 "hero"、"about" */
  type: string
  /** Block 的 React 组件 */
  component: ComponentType<BlockProps<T>>
  /** 该 block data 的 zod schema（构建期校验 + 运行时校验用） */
  schema?: ZodType<T>
}

/** Block 组件接收的标准 Props */
export interface BlockProps<T = unknown> {
  /** 该 Block 的业务数据，来自 space.json */
  data: T
  /** 全局主题 */
  theme: ThemeConfig
  /** 在页面中的位置索引（用于动画延迟计算） */
  index: number
}
