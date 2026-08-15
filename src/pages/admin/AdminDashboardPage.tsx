import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/lib/admin/api'
import type { AdminUserSummary } from '../../../functions/_lib/types'

/** /admin — 客户列表 + 生成编辑链接 + 新建入口 */
export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkFor, setLinkFor] = useState<string | null>(null)
  const [editLinks, setEditLinks] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    adminApi.listUsers()
      .then(setUsers)
      .catch(err => {
        if (err instanceof Error && err.message.includes('未登录')) {
          window.location.href = '/admin/login'
          return
        }
        setError(err instanceof Error ? err.message : '加载失败')
      })
  }, [])

  async function generateLink(userId: string) {
    setLinkFor(userId)
    try {
      const { url } = await adminApi.createEditLink(userId)
      setEditLinks(prev => ({ ...prev, [userId]: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成链接失败')
    } finally {
      setLinkFor(null)
    }
  }

  async function copyLink(userId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(userId)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setError('复制失败，请手动复制')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-800">客户网站管理</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/newUser"
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            + 新建用户
          </Link>
          <button
            onClick={() => adminApi.logout().then(() => window.location.href = '/admin/login')}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
        {users === null && !error && (
          <div className="px-6 py-10 text-center text-sm text-stone-400">加载中...</div>
        )}
        {users?.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-stone-400">
            暂无客户，点击右上角「新建用户」开始
          </div>
        )}
        {users?.map(user => (
          <div key={user.userId} className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-stone-800">
                  {user.displayName || user.userId}
                  <span className="ml-2 text-xs text-stone-400 font-normal">/{user.userId}</span>
                </div>
                {user.updatedAt && (
                  <div className="mt-0.5 text-xs text-stone-400">
                    最后更新：{new Date(user.updatedAt).toLocaleString('zh-CN')}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`/${user.userId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  查看站点 ↗
                </a>
                <button
                  onClick={() => generateLink(user.userId)}
                  disabled={linkFor === user.userId}
                  className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-50
                    hover:bg-stone-700 disabled:opacity-50 transition-colors"
                >
                  {linkFor === user.userId ? '生成中...' : '生成编辑链接'}
                </button>
              </div>
            </div>

            {editLinks[user.userId] && (
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-stone-50 border border-stone-200 px-3 py-1.5 text-xs text-stone-600">
                  {editLinks[user.userId]}
                </code>
                <button
                  onClick={() => copyLink(user.userId, editLinks[user.userId])}
                  className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  {copied === user.userId ? '已复制 ✓' : '复制'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
