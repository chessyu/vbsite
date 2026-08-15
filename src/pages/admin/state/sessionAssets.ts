/**
 * 编辑器会话资源映射表 — 远端路径 → 本地预览（dataUrl / blob URL）。
 *
 * 为什么需要：admin 上传的图片/视频只 commit 到 GitHub，本地磁盘不存在；
 * dev 下 vite 对不存在的路径返回 SPA fallback HTML（200），<img> 拿到 HTML 渲染失败。
 * 该映射让预览 iframe 在渲染 config 前把已知远端路径替换为本地数据。
 *
 * 约定：纯编辑器内存态 —— 不进 draft、不进 localStorage、天然不会被发布（publish 提交的是 draft）。
 * 注意：跨 iframe 使用（PreviewPage 在 iframe 内 import 同一模块，同源同 bundle 副本，模块单例共享）。
 */

const sessionAssets = new Map<string, string>()

/** 上传成功后登记：远端路径 → 本地预览数据（dataUrl 或 blob URL） */
export function registerSessionAsset(remotePath: string, previewData: string): void {
  sessionAssets.set(remotePath, previewData)
}

/** 查找某远端路径的会话内预览数据 */
export function lookupSessionAsset(remotePath: string): string | undefined {
  return sessionAssets.get(remotePath)
}

/** 导出为普通对象（postMessage 传给预览 iframe 用） */
export function getSessionAssets(): Record<string, string> {
  return Object.fromEntries(sessionAssets)
}

/**
 * 深度替换 config 中所有可替换的资源路径（返回新对象，不改原 draft）。
 * 匹配规则：string 值以 /users/ 开头且在映射表中。
 */
export function applySessionAssets<T>(value: T): T {
  const visit = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return node.startsWith('/users/') ? sessionAssets.get(node) ?? node : node
    }
    if (Array.isArray(node)) return node.map(visit)
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(node)) out[k] = visit(v)
      return out
    }
    return node
  }
  return visit(value) as T
}
