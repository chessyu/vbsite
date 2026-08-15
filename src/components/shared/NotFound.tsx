import { Link } from 'react-router-dom'

/** 通用 404 页面 — 占满视口，不依赖任何布局壳 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <div className="text-stone-300 text-8xl font-bold select-none" aria-hidden>404</div>
      <p className="mt-4 text-stone-500 text-lg">此页面不存在</p>
      <Link
        to="/"
        className="mt-8 px-6 py-2.5 rounded-full bg-stone-800 text-stone-50 text-sm
          hover:bg-stone-700 transition-colors"
      >
        返回首页
      </Link>
    </div>
  )
}
