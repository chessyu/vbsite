import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/lib/admin/api'

/** /admin/newUser — 输入 userId 后跳转编辑链接（空配置起步由编辑器发布流程创建） */
export default function AdminNewUserPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || creating) return
    setCreating(true)
    setError(null)
    try {
      // 生成编辑链接后直接跳转（admin session 可通过 requireEditToken 的回落分支直接编辑）
      const { url } = await adminApi.createEditLink(userId)
      const path = new URL(url).pathname + new URL(url).search
      navigate(path, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-800">新建用户网站</h1>
      <p className="mt-1 text-sm text-stone-500">
        输入用户 ID（将作为访问路径 <code className="rounded bg-stone-100 px-1">/用户ID</code>），
        创建后进入编辑器配置内容并发布。首次发布会同时创建 space.json。
      </p>
      <p className="mt-2 text-xs text-stone-400">
        ⚠️ 用户数据提交到 <code className="rounded bg-stone-100 px-1">GITHUB_BRANCH</code> 配置的分支。
        当前该分支尚无任何用户数据时列表会显示为空，属正常现象——第一个用户发布后即出现。
      </p>

      <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block text-xs font-medium text-stone-600">用户 ID</label>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value.toLowerCase().trim())}
          placeholder="如 cheesyu、demi（小写字母/数字/连字符）"
          autoFocus
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-stone-700 focus:border-stone-700"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={creating || !userId}
          className="mt-4 w-full rounded-lg bg-stone-800 py-2.5 text-sm text-stone-50
            hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {creating ? '创建中…' : '创建并进入编辑器'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="mt-4 text-sm text-stone-500 hover:text-stone-700"
      >
        ← 返回列表
      </button>
    </div>
  )
}
