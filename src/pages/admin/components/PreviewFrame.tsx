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
export function PreviewFrame({ config, pageId, blockIdx, onPageChange }: {
  config: SpaceConfig
  pageId: string
  /** 编辑器当前选中的 block（-1 = 未选中）——变化时让预览滚动到对应区块 */
  blockIdx: number
  /** 工具栏下拉切页回调（受控：pageId 由外部持有，与左侧下拉同源） */
  onPageChange?: (pageId: string) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  // 预览页与左侧下拉共用外部 pageId（单一数据源），两个下拉天然同步
  const previewPage = pageId

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

  // 视口切换 → 通知 iframe 刷新 ScrollTrigger。
  // 外层 max-w 变化会让 iframe 内布局重排（页高变化），但 GSAP 对 iframe 元素缩放
  // 的自动 resize 刷新在此场景不生效——不手动 refresh，入场触发点还是旧桌面坐标，
  // 移动预览下所有入场动画会死锁在 autoAlpha:0（已实测复现）。
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'viewport-change' }, window.location.origin)
  }, [viewport])

  // 选中 block → 通知 iframe 滚动到该区块（子页面内部延迟执行，避开 config 推送 debounce）
  useEffect(() => {
    if (blockIdx < 0 || !ready) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'scroll-to-block', blockIndex: blockIdx },
      window.location.origin,
    )
  }, [blockIdx, ready])

  return (
    <div className="flex h-full flex-col">
      {/* 工具条 */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-3 py-1.5">
        <select
          value={previewPage}
          onChange={e => onPageChange?.(e.target.value)}
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

      {/* 移动视口如实反映真实手机效果（静态降级），提示避免误认为动效丢失 */}
      {viewport === 'mobile' && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-[11px] leading-relaxed text-amber-700">
          📱 移动视口 = 真实手机效果：视频首屏随滚动播放（scrub）、部分仅桌面动效已关闭（属预期）
        </div>
      )}

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
