import { withEnv } from '../../_lib/env'
import { jsonOk } from '../../_lib/http'
import { requireAdmin, isResponse } from '../../_lib/auth'
import { listUserDirs, readSpace } from '../../_lib/github'
import type { AdminUserSummary } from '../../_lib/types'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
}

const DISPLAY_NAME_RE = /"displayName"\s*:\s*"([^"]*)"/

/** GET /api/admin/users — 列出客户（目录 + 从 space.json 提取展示名） */
export const onRequestGet = withEnv<PagesContext>(async ({ request }, env) => {
  const admin = await requireAdmin(request, env)
  if (isResponse(admin)) return admin

  const dirs = await listUserDirs(env)
  if (isResponse(dirs)) return dirs

  const users = await Promise.all(
    dirs.map(async (userId): Promise<AdminUserSummary> => {
      const space = await readSpace(env, userId)
      if (!space || isResponse(space)) {
        return { userId, displayName: null, updatedAt: null }
      }
      // 轻量提取 displayName，避免完整 JSON.parse（readSpace 已返回文本）
      const match = DISPLAY_NAME_RE.exec(space.content)
      return { userId, displayName: match?.[1] ?? null, updatedAt: null }
    }),
  )

  return jsonOk({ users })
})
