import { withEnv } from '../../_lib/env'
import { jsonOk } from '../../_lib/http'
import { requireAdmin, isResponse } from '../../_lib/auth'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
}

/** GET /api/admin/session — 探测登录状态（前端路由守卫用） */
export const onRequestGet = withEnv<PagesContext>(async ({ request }, env) => {
  const admin = await requireAdmin(request, env)
  if (isResponse(admin)) {
    return jsonOk({ authenticated: false })
  }
  return jsonOk({ authenticated: true, expiresAt: admin.exp })
})
