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
    // 无样式包裹层：data-block-index 供编辑器预览滚动定位（block 均为块级 section，多一层 div 不影响布局/sticky）
    <div data-block-index={index}>
      <ErrorBoundary blockType={declaration.type} theme={theme}>
        <Component data={declaration.data} theme={theme} index={index} />
      </ErrorBoundary>
    </div>
  )
}
