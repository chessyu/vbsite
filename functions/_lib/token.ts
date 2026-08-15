/**
 * HMAC 签名无状态 token（Web Crypto，Workers / Node 18+ 通用，零依赖）。
 *
 * 格式：v1.<base64url(payloadJSON)>.<base64url(HMAC-SHA256)>
 * - payload: { u: userId, exp: Unix秒, s: scope }（s 区分 "edit" / "admin"，防两种凭证互用）
 * - 签名消息 = "v1." + base64url(payload)，版本号纳入签名，未来可平滑升级 v2
 */

const encoder = new TextEncoder()

export type TokenScope = 'edit' | 'admin'

export interface TokenPayload {
  u: string
  exp: number
  s: TokenScope
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecodeString(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  return atob(padded)
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await hmacKey(secret)
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return base64UrlEncode(new Uint8Array(mac))
}

/** 常数时间比较（防时序攻击） */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false
  const bufA = encoder.encode(a)
  const bufB = encoder.encode(b)
  let diff = 0
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i]
  }
  return diff === 0
}

export async function signToken(
  payload: TokenPayload,
  secret: string,
): Promise<string> {
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  const version = 'v1'
  const signature = await sign(`${version}.${encoded}`, secret)
  return `${version}.${encoded}.${signature}`
}

export type VerifyFailure = 'FORMAT' | 'SIGNATURE' | 'EXPIRED'

export async function verifyToken(
  token: string | null | undefined,
  secret: string,
  options: { scope?: TokenScope; userId?: string } = {},
): Promise<{ ok: true; payload: TokenPayload } | { ok: false; reason: VerifyFailure }> {
  if (!token) return { ok: false, reason: 'FORMAT' }
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'FORMAT' }
  const [version, encoded, signature] = parts
  if (version !== 'v1' || !encoded || !signature) return { ok: false, reason: 'FORMAT' }

  const expected = await sign(`${version}.${encoded}`, secret)
  if (!(await timingSafeEqual(signature, expected))) return { ok: false, reason: 'SIGNATURE' }

  let payload: TokenPayload
  try {
    payload = JSON.parse(base64UrlDecodeString(encoded)) as TokenPayload
  } catch {
    return { ok: false, reason: 'FORMAT' }
  }
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    return { ok: false, reason: 'EXPIRED' }
  }
  if (options.scope && payload.s !== options.scope) return { ok: false, reason: 'SIGNATURE' }
  if (options.userId && payload.u !== options.userId) return { ok: false, reason: 'SIGNATURE' }

  return { ok: true, payload }
}
