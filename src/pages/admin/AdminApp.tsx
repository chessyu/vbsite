import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

/**
 * /admin 布局壳。
 * 内层路由各自处理鉴权（dashboard 系列依赖 admin session，edit 依赖 token），
 * 这里只提供Suspense 兜底与最小容器。
 */
export default function AdminApp() {
  return (
    <div className="min-h-screen bg-stone-100">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-stone-400">加载中...</div>}>
        <Outlet />
      </Suspense>
    </div>
  )
}
