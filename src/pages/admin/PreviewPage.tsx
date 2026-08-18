import { useEffect, useState } from 'react'
import { BlockRenderer } from '@/blocks/BlockRenderer'
import Footer from '@/components/shared/Footer'
import CursorGlow from '@/components/ui/CursorGlow'
import { ScrollTrigger } from '@/lib/gsap'
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
  /** 会话资源映射（远端路径 → dataUrl），随 postMessage 从编辑器传来 */
  const [assetMap, setAssetMap] = useState<Record<string, string>>({})

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data as {
        type?: string
        config?: SpaceConfig
        pageId?: string
        assets?: Record<string, string>
      }
      if (data?.type === 'space-config' && data.config) {
        if (data.assets) setAssetMap(data.assets)
        setPageId({ config: data.config, pageId: data.pageId ?? 'home' })
        return
      }
      // 父窗口视口切换（桌面 ⇄ 移动）：外层容器宽度变化让本页布局重排，
      // 但 GSAP 的自动 resize 刷新对 iframe 元素缩放不生效——手动 refresh
      // 重算触发点，否则入场动画死锁在初始隐藏态。延迟等布局稳定。
      if (data?.type === 'viewport-change') {
        setTimeout(() => ScrollTrigger.refresh(), 120)
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

  // 渲染前应用会话资源映射：刚上传的图片远端路径 → dataUrl（否则 dev 下 SPA fallback 返回 HTML，img 渲染失败）
  const resolved = applyAssetMap(config.config, assetMap)
  return <PreviewContent config={resolved} pageId={config.pageId} />
}

/** 深度替换 config 中的资源路径（string 以 /users/ 开头且在映射中） */
function applyAssetMap(value: unknown, map: Record<string, string>): SpaceConfig {
  const visit = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return node.startsWith('/users/') ? map[node] ?? node : node
    }
    if (Array.isArray(node)) return node.map(visit)
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(node)) out[k] = visit(v)
      return out
    }
    return node
  }
  return visit(value) as SpaceConfig
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
