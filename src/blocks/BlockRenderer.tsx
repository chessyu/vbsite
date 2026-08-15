import { getBlock } from './registry'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { BlockDeclaration, ThemeConfig } from '@/types/space'

interface BlockRendererProps {
  declaration: BlockDeclaration
  theme: ThemeConfig
  index: number
}

export function BlockRenderer({ declaration, theme, index }: BlockRendererProps) {
  const definition = getBlock(declaration.type)
  if (!definition) {
    // 未知 type 已在 parseSpaceConfig 阶段过滤并警告，此处为双保险
    if (import.meta.env.DEV) {
      console.warn(`[VBSite] Unknown block type: "${declaration.type}"`)
    }
    return null
  }

  const Component = definition.component
  return (
    <ErrorBoundary blockType={declaration.type} theme={theme}>
      <Component data={declaration.data} theme={theme} index={index} />
    </ErrorBoundary>
  )
}
