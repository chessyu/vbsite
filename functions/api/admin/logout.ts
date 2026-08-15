import { jsonOk } from '../../_lib/http'
import { ADMIN_COOKIE } from '../../_lib/auth'

/** POST /api/admin/logout — 清除 admin session */
export const onRequestPost = () => {
  const response = jsonOk({ ok: true })
  response.headers.append(
    'Set-Cookie',
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  )
  return response
}
