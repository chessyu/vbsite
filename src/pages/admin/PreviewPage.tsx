import { useEffect, useState } from 'react'
import { BlockRenderer } from '@/blocks/BlockRenderer'
import Footer from '@/components/shared/Footer'
import CursorGlow from '@/components/ui/CursorGlow'
import type { SpaceConfig } from '@/lib/spaceSchema'

/**
 * /admin/preview — iframe 内侧页面。
 * 渲染链路复刻 SingleUserSpacePage（BlockRenderer + CursorGlow + Footer），
 * config 由父窗口 postMessage 传入（同源，校验 origin），完全不发请求。
 */
export default function PreviewPage() {
  const [config, setPageId] = useState<{ config: SpaceConfig | null; pageId: string }>({
    config: null,
    pageId: 'home',
  })

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; config?: SpaceConfig; pageId?: string }
      if (data?.type === 'space-config' && data.config) {
        setPageId({ config: data.config, pageId: data.pageId ?? 'home' })
      }
    }
    window.addEventListener('message', handleMessage)
    // 通知父窗口已就绪（触发首帧推送）
    window.parent?.postMessage({ type: 'preview-ready' }, window.location.origin)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!config.config) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-stone-300">
        等待编辑数据…
      </div>
    )
  }

  return <PreviewContent config={config.config} pageId={config.pageId} />
}

/** 与内容分离：pageId 变化时强制重挂（重建 ScrollTrigger 上下文） */
function PreviewContent({ config, pageId }: { config: SpaceConfig; pageId: string }) {
  const page = config.pages.find(p => p.id === pageId) ?? config.pages[0]
  if (!page) return null

  return (
    <div style={{ background: config.theme.background, minHeight: '100vh' }}>
      <CursorGlow dark={config.theme.mode === 'dark'} />
      {page.blocks.map((block, index) => (
        <BlockRenderer
          key={`${pageId}-${block.type}-${index}`}
          declaration={block}
          theme={config.theme}
          index={index}
        />
      ))}
      <Footer text={config.space.footer} dark={config.theme.mode === 'dark'} />
    </div>
  )
}
