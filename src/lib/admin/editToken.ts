/**
 * edit token 的纯 UX 层解析。
 * 注意：这里不验签（密钥在服务端，浏览器验了也无意义），只读 exp 做倒计时/过期提示。
 * 真正的鉴权全部在 Functions 端完成。
 */

export interface EditTokenPayload {
  /** 目标 userId */
  u: string
  /** 过期时间（Unix 秒） */
  exp: number
  /** 用途 scope */
  s: string
}

function base64UrlDecode(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  return atob(padded)
}

/** 解析 token payload；格式非法返回 null（交由 API 层/404 兜底） */
export function parseEditToken(token: string | null | undefined): EditTokenPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return null
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as EditTokenPayload
  } catch {
    return null
  }
}

/** token 是否已过期（UX 提示用） */
export function isEditTokenExpired(payload: EditTokenPayload | null): boolean {
  if (!payload?.exp) return true
  return payload.exp * 1000 <= Date.now()
}

/** 剩余有效时长的人类可读描述 */
export function formatRemaining(payload: EditTokenPayload | null): string {
  if (!payload?.exp) return '已过期'
  const ms = payload.exp * 1000 - Date.now()
  if (ms <= 0) return '已过期'
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 1) return `剩余 ${hours} 小时`
  const minutes = Math.max(1, Math.floor(ms / 60_000))
  return `剩余 ${minutes} 分钟`
}
