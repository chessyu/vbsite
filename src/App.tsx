import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import StarPage from './pages/StarPage'
import UserSpacePage from './pages/UserSpacePage'
import SingleUserSpacePage from './pages/SingleUserSpacePage'
import { useSpaceConfig } from './hooks/useSpaceConfig'
import { getLastVisitedUser } from './components/RootRedirect'

// admin 后台整体懒加载（不进首屏 bundle）
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminNewUserPage = lazy(() => import('./pages/admin/AdminNewUserPage'))
const AdminEditPage = lazy(() => import('./pages/admin/AdminEditPage'))
const PreviewPage = lazy(() => import('./pages/admin/PreviewPage'))
const NotFound = lazy(() => import('./components/shared/NotFound'))

/** 根路由：重定向到最近访问的用户空间 */
function RootRedirect() {
  const lastUser = getLastVisitedUser()
  if (lastUser) {
    return <Navigate to={`/${lastUser}`} replace />
  }
  return <LandingPage />
}

/** 单用户构建模式的应用 */
function SingleUserApp() {
  const username = import.meta.env.VITE_BUILD_USER as string
  const { config, loading, error } = useSpaceConfig(username)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 text-lg">加载中...</div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 text-lg">
          {error?.kind === 'invalid-config' || error?.kind === 'parse-build'
            ? '页面配置出错，请检查 space.json'
            : '配置加载失败'}
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<SingleUserSpacePage config={config} pageId="home" />} />
      {config.pages
        .filter(p => p.path !== '/')
        .map(page => (
          <Route
            key={page.id}
            path={page.path}
            element={<SingleUserSpacePage config={config} pageId={page.id} />}
          />
        ))}
      {/* 单用户模式：未知路由重定向到首页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** 多用户模式的应用入口 */
function MultiUserApp() {
  return (
    <Routes>
      {/* 官方落地页 */}
      <Route path="/" element={<RootRedirect />} />

      {/* GSAP 高动效个人主页 Demo（刘德华） */}
      <Route path="/star" element={<StarPage />} />

      {/* 用户空间（含子页面，未知用户/页面由 UserSpacePage 内部处理重定向） */}
      <Route path="/:username" element={<UserSpacePage />} />
      <Route path="/:username/:pageId" element={<UserSpacePage />} />

      {/* 管理后台（静态段 "admin" 按 specificity 恒优先于 :username） */}
      <Route path="/admin" element={<AdminApp />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="newUser" element={<AdminNewUserPage />} />
        <Route path=":userId/edit" element={<AdminEditPage />} />
        <Route path="preview" element={<PreviewPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* 兜底：所有未匹配路由重定向到根路径 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // 单用户构建模式：直接渲染该用户的页面
  if (import.meta.env.VITE_BUILD_USER) {
    return <SingleUserApp />
  }

  // 多用户模式（开发/官网部署）
  return <MultiUserApp />
}
