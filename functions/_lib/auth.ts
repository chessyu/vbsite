import { jsonError } from './http'
import { verifyToken, type TokenPayload } from './token'
import type { AdminEnv } from './env'

export const ADMIN_COOKIE = 'vb_admin'

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

/** 校验管理员 session；通过则返回 payload，否则返回 401 Response */
export async function requireAdmin(
  request: Request,
  env: AdminEnv,
): Promise<TokenPayload | Response> {
  const result = await verifyToken(readCookie(request, ADMIN_COOKIE), env.ADMIN_TOKEN_SECRET, {
    scope: 'admin',
  })
  if (!result.ok) {
    return jsonError('UNAUTHORIZED', '未登录或会话已过期', 401)
  }
  return result.payload
}

/**
 * 校验编辑凭证：edit token（query）或 admin session 皆可
 * （方便站长不经链接直接编辑）。
 */
export async function requireEditToken(
  request: Request,
  url: URL,
  env: AdminEnv,
): Promise<TokenPayload | Response> {
  const token = url.searchParams.get('token')
  const result = await verifyToken(token, env.ADMIN_TOKEN_SECRET, { scope: 'edit' })
  if (result.ok) return result.payload

  // edit token 无效时回落 admin session
  const admin = await requireAdmin(request, env)
  if (!(admin instanceof Response)) return admin

  // 两种凭证都失败：区分过期与无效（客户端统一渲染 404）
  if (result.reason === 'EXPIRED') {
    return jsonError('TOKEN_EXPIRED', '编辑链接已过期', 401)
  }
  return jsonError('UNAUTHORIZED', '无效的编辑凭证', 401)
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response
}
