import { withEnv } from '../../_lib/env'
import { jsonError, jsonOk, readJson } from '../../_lib/http'
import { requireAdmin, isResponse } from '../../_lib/auth'
import { signToken } from '../../_lib/token'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
}

const USER_ID_RE = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$|^[a-z0-9]$/

/** POST /api/admin/edit-link — 生成临时编辑链接 */
export const onRequestPost = withEnv<PagesContext>(async ({ request }, env) => {
  const admin = await requireAdmin(request, env)
  if (isResponse(admin)) return admin

  const body = await readJson<{ userId?: string; ttlHours?: number }>(request)
  const userId = body?.userId
  if (typeof userId !== 'string' || !USER_ID_RE.test(userId)) {
    return jsonError('INVALID_INPUT', 'userId 格式非法（小写字母/数字/连字符）', 400)
  }

  // ttlHours 可覆盖默认值，但不超过 168h（7 天）上限
  const ttlHours =
    typeof body?.ttlHours === 'number' && body.ttlHours > 0
      ? Math.min(body.ttlHours, 168)
      : env.EDIT_LINK_TTL_HOURS

  const expiresAt = Math.floor(Date.now() / 1000) + Math.round(ttlHours * 3600)
  const token = await signToken({ u: userId, exp: expiresAt, s: 'edit' }, env.ADMIN_TOKEN_SECRET)

  const origin = new URL(request.url).origin
  const url = `${origin}/admin/${userId}/edit?token=${encodeURIComponent(token)}`
  return jsonOk({ url, token, expiresAt })
})
