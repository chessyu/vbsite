import { useParams, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { BlockRenderer } from '@/blocks/BlockRenderer'
import Footer from '@/components/shared/Footer'
import CursorGlow from '@/components/ui/CursorGlow'
import { useSpaceConfig } from '@/hooks/useSpaceConfig'
import { recordLastVisitedUser, getLastVisitedUser } from '@/components/RootRedirect'

export default function UserSpacePage() {
  const { username, pageId } = useParams<{ username: string; pageId?: string }>()
  const { config, loading, error } = useSpaceConfig(username!)

  useEffect(() => {
    if (username && config) {
      recordLastVisitedUser(username)
    }
  }, [username, config])

  useEffect(() => {
    if (config) {
      const page = pageId
        ? config.pages.find(p => p.id === pageId)
        : config.pages.find(p => p.path === '/')
      if (page) document.title = page.title
    }
  }, [config, pageId])

  // 加载中 → 显示加载动画（不要重定向）
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fce7f3 70%, #ede9fe 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-warm-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-stone-500 text-sm">加载中...</div>
        </div>
      </div>
    )
  }

  // 配置格式错误 → 显示错误信息（不重定向，避免把配置 bug 伪装成「用户不存在」）
  if (error && error.kind !== 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-lg">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold text-stone-900">页面配置出错了</h1>
          <p className="text-sm text-stone-500">
            {username} 的空间配置（space.json）格式有误，请联系站长修复。
          </p>
          {error.kind === 'invalid-config' && (
            <pre className="w-full max-h-48 overflow-auto rounded-lg bg-stone-100 p-4 text-left text-xs text-red-600 whitespace-pre-wrap">
              {error.issues.join('\n')}
            </pre>
          )}
        </div>
      </div>
    )
  }

  // 用户空间不存在 → 重定向
  if (error || !config) {
    const lastUser = getLastVisitedUser()
    if (lastUser && lastUser !== username) {
      return <Navigate to={`/${lastUser}`} replace />
    }
    return <Navigate to="/" replace />
  }

  // 查找当前页面配置
  const page = pageId
    ? config.pages.find(p => p.id === pageId)
    : config.pages.find(p => p.path === '/')

  if (!page) {
    return <Navigate to={`/${username}`} replace />
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
