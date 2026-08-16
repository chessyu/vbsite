import { useEffect, useRef, useState } from 'react'
import type { SpaceConfig } from '@/lib/spaceSchema'
import { getSessionAssets } from '../state/sessionAssets'

/**
 * 预览容器 — iframe 挂 /admin/preview，postMessage 推送 config。
 * iframe 的独立 window 保证 ScrollTrigger 滚动动效正确（产品核心卖点），
 * 同时隔离 theme 全局类名与编辑器 Tailwind 的冲突。
 * 支持 桌面/移动（390px）视口切换。
 * 会话资源映射（刚上传图片的 dataUrl 预览）随消息一起传给 iframe（独立 bundle 不共享模块单例）。
 */
export function PreviewFrame({ config, pageId }: {
  config: SpaceConfig
  pageId: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [previewPage, setPreviewPage] = useState(pageId)

  // 预览页 onload 后标记就绪
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const handleLoad = () => setReady(true)
    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [])

  // config 变更 → debounce 150ms → postMessage（带会话资源映射）
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'space-config', config, pageId: previewPage, assets: getSessionAssets() },
        window.location.origin,
      )
    }, 150)
    return () => clearTimeout(timer)
  }, [config, previewPage, ready])

  // 子页面就绪通知（重载场景）→ 立即推一帧
  useEffect(() => {
    function handleChildMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if ((event.data as { type?: string })?.type === 'preview-ready') {
        setReady(true)
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'space-config', config, pageId: previewPage, assets: getSessionAssets() },
          window.location.origin,
        )
      }
    }
    window.addEventListener('message', handleChildMessage)
    return () => window.removeEventListener('message', handleChildMessage)
  }, [config, previewPage])

  return (
    <div className="flex h-full flex-col">
      {/* 工具条 */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-3 py-1.5">
        <select
          value={previewPage}
          onChange={e => setPreviewPage(e.target.value)}
          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600"
        >
          {config.pages.map(page => (
            <option key={page.id} value={page.id}>{page.title || page.id}</option>
          ))}
        </select>
        <div className="flex rounded-md border border-stone-300 bg-white p-0.5">
          {(['desktop', 'mobile'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewport(mode)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                viewport === mode ? 'bg-stone-800 text-stone-50' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {mode === 'desktop' ? '🖥 桌面' : '📱 移动'}
            </button>
          ))}
        </div>
        {!ready && <span className="text-[11px] text-stone-400">预览加载中…</span>}
      </div>

      {/* iframe */}
      <div className="flex-1 overflow-hidden bg-stone-200 p-2">
        <div className={`mx-auto h-full ${viewport === 'mobile' ? 'max-w-[390px]' : 'max-w-full'}`}>
          <iframe
            ref={iframeRef}
            src="/admin/preview"
            title="站点预览"
            className="h-full w-full rounded-lg border border-stone-300 bg-white shadow-sm"
          />
        </div>
      </div>
    </div>
  )
}
