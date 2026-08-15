import type { ApiErrorCode } from './types'

/** 统一响应包：{ ok: true, data } / { ok: false, error: { code, message } } */

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init)
}

export function jsonError(code: ApiErrorCode, message: string, status: number): Response {
  return Response.json({ ok: false, error: { code, message } }, { status })
}

/** 从 request body 读 JSON；解析失败返回 null */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

/** 提取客户端 IP（Pages Functions 的 CF-Connecting-IP） */
export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown'
}

/** 实例内存级限速（够用的粗粒度防护，不追求精确） */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}
