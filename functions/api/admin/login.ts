import { withEnv } from '../../_lib/env'
import { jsonError, jsonOk, rateLimit, clientIp, readJson } from '../../_lib/http'
import { ADMIN_COOKIE } from '../../_lib/auth'
import { signToken } from '../../_lib/token'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
}

/** POST /api/admin/login — 密码登录，签发 HttpOnly admin session */
export const onRequestPost = withEnv<PagesContext>(async ({ request }, env) => {
  if (!rateLimit(`login:${clientIp(request)}`, 5, 60_000)) {
    return jsonError('RATE_LIMITED', '尝试过于频繁，请稍后再试', 429)
  }

  const body = await readJson<{ password?: string }>(request)
  if (!body || typeof body.password !== 'string') {
    return jsonError('INVALID_INPUT', '缺少 password', 400)
  }

  if (body.password !== env.ADMIN_PASSWORD) {
    return jsonError('UNAUTHORIZED', '密码错误', 401)
  }

  const expiresAt = Math.floor(Date.now() / 1000) + env.ADMIN_SESSION_TTL_HOURS * 3600
  const token = await signToken({ u: 'admin', exp: expiresAt, s: 'admin' }, env.ADMIN_TOKEN_SECRET)

  const response = jsonOk({ expiresAt })
  response.headers.append(
    'Set-Cookie',
    [
      `${ADMIN_COOKIE}=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      `Max-Age=${env.ADMIN_SESSION_TTL_HOURS * 3600}`,
    ].join('; '),
  )
  return response
})
