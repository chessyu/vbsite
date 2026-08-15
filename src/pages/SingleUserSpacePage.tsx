import { BlockRenderer } from '@/blocks/BlockRenderer'
import Footer from '@/components/shared/Footer'
import CursorGlow from '@/components/ui/CursorGlow'
import type { SpaceConfig } from '@/types/space'

interface SingleUserSpacePageProps {
  config: SpaceConfig
  pageId: string
}

export default function SingleUserSpacePage({ config, pageId }: SingleUserSpacePageProps) {
  const page = config.pages.find(p => p.id === pageId)
  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 text-lg">页面 "{pageId}" 未找到</div>
      </div>
    )
  }

  return (
    <div style={{ background: config.theme.background, minHeight: '100vh' }}>
      <CursorGlow dark={config.theme.mode === 'dark'} />
      {page.blocks.map((block, index) => (
        <BlockRenderer
          key={`${block.type}-${index}`}
          declaration={block}
          theme={config.theme}
          index={index}
        />
      ))}
      <Footer text={config.space.footer} dark={config.theme.mode === 'dark'} />
    </div>
  )
}
