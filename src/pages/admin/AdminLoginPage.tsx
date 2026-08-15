import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/lib/admin/api'

/** /admin/login — ADMIN_PASSWORD 极简登录 */
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await adminApi.login(password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-stone-200"
      >
        <h1 className="text-xl font-semibold text-stone-800">VBSite 管理后台</h1>
        <p className="mt-1 text-sm text-stone-500">请输入管理员密码</p>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="管理员密码"
          autoFocus
          className="mt-6 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-stone-700 focus:border-stone-700"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !password}
          className="mt-4 w-full rounded-lg bg-stone-800 py-2.5 text-sm text-stone-50
            hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}
