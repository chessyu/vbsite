import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { ThemeConfig } from '@/types/space'

/**
 * 全局错误边界（React class 组件，官方唯一方式）。
 *
 * 两种形态：
 * - App 级（不传 blockType）：全屏降级 UI + 刷新按钮，朴素中性样式（不依赖 theme，可能崩在 theme 读取前）
 * - Block 级（传 blockType + theme）：占位降级 section，颜色跟随页面主题
 *
 * 注意：降级 UI 不使用 GSAP 动画，避免二次崩溃。
 */

interface ErrorBoundaryProps {
  /** Block 级边界必传：出错的 block type，用于标注降位位置 */
  blockType?: string
  /** Block 级边界传入：降级 UI 跟随页面主题 */
  theme?: ThemeConfig
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.group(`[VBSite] ErrorBoundary 捕获错误${this.props.blockType ? `（block: ${this.props.blockType}）` : ''}`)
      console.error(error)
      console.error(info.componentStack)
      console.groupEnd()
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    // Block 级：占位降级 section，跟随主题
    if (this.props.blockType) {
      const theme = this.props.theme
      return (
        <section className="min-h-[200px] flex items-center justify-center px-6">
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-current/10 px-8 py-6 text-center max-w-md"
            style={{ color: theme?.textColor }}
          >
            <AlertTriangle className="w-6 h-6 opacity-60" />
            <p className="text-sm font-medium">该区块暂时无法展示</p>
            <p className="text-xs" style={{ color: theme?.mutedTextColor }}>
              {import.meta.env.DEV ? `${this.props.blockType}: ${error.message}` : '请稍后再试'}
            </p>
          </div>
        </section>
      )
    }

    // App 级：全屏降级 UI，朴素中性样式（不依赖任何配置）
    return (
      <div className="min-h-screen bg-white text-stone-900 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-lg">
          <AlertTriangle className="w-10 h-10 text-stone-400" />
          <h1 className="text-xl font-semibold">页面出错了</h1>
          <p className="text-sm text-stone-500">抱歉，页面渲染遇到问题，请刷新重试。</p>
          {import.meta.env.DEV && (
            <pre className="mt-2 w-full max-h-48 overflow-auto rounded-lg bg-stone-100 p-4 text-left text-xs text-red-600 whitespace-pre-wrap">
              {error.message}
              {error.stack ? `\n\n${error.stack.split('\n').slice(1, 5).join('\n')}` : ''}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
