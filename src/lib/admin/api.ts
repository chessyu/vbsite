/**
 * 浏览器侧 admin API 封装。
 * admin session 走 HttpOnly Cookie（同源自动携带）；edit token 显式传参。
 */

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

interface ApiEnvelope<T> {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init
  const url = token ? `${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : path
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(rest.body && !(rest.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
    credentials: 'same-origin',
  })
  const payload = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!res.ok || !payload?.ok) {
    const err = payload?.error
    throw new ApiError(err?.code ?? 'UNKNOWN', err?.message ?? `请求失败（${res.status}）`, res.status)
  }
  return payload.data as T
}

export const adminApi = {
  /** 管理员登录 */
  login: (password: string) =>
    request<{ expiresAt: number }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  /** 退出登录 */
  logout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST' }),

  /** 列出客户 */
  listUsers: () => request<{ users: AdminUserSummary[] }>('/api/admin/users').then(d => d.users),

  /** 生成临时编辑链接 */
  createEditLink: (userId: string, ttlHours?: number) =>
    request<{ url: string; token: string; expiresAt: number }>('/api/admin/edit-link', {
      method: 'POST',
      body: JSON.stringify({ userId, ttlHours }),
    }),
}

export const spaceApi = {
  /** 读取用户 space.json（从 GitHub） */
  get: (userId: string, token: string) =>
    request<{ config: unknown; sha: string | null }>(`/api/space/${encodeURIComponent(userId)}`, { token }),

  /** 发布 space.json（严格校验 + 单 commit） */
  publish: (userId: string, config: unknown, token: string, message?: string) =>
    request<{ commitSha: string; htmlUrl: string }>(`/api/space/${encodeURIComponent(userId)}/publish`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ config, message }),
    }),

  /** 上传图片资源，返回可写入 config 的绝对路径 + 会话内预览 data URL */
  uploadAssets: (userId: string, files: File[], token: string) =>
    request<{ files: AssetUploadResult[] }>(`/api/space/${encodeURIComponent(userId)}/assets`, {
      method: 'POST',
      token,
      body: buildFormData(files),
    }),

  /**
   * 上传文档（md/txt 文件，或前端已抽取的纯文本如 pdf）调 LLM 分析，
   * 返回当前页区块的 patches + 分配说明（用户确认后前端逐块应用）。
   */
  aiAnalyze: (
    userId: string,
    input: { file?: File; text?: string; blocks: Array<{ type: string; data: unknown }> },
    token: string,
  ) => {
    const form = new FormData()
    if (input.file) form.append('file', input.file, input.file.name)
    if (input.text) form.append('text', input.text)
    form.append('blocks', JSON.stringify(input.blocks))
    return request<{ patches: AiPatch[]; notes: string }>(`/api/space/${encodeURIComponent(userId)}/ai-analyze`, {
      method: 'POST',
      token,
      body: form,
    })
  },
}

function buildFormData(files: File[]): FormData {
  const form = new FormData()
  for (const file of files) form.append('files', file, file.name)
  return form
}

// ---- DTO 类型（与 functions/_lib/types.ts 保持一致，type-only 引入避免运行时耦合）----
import type { AdminUserSummary, AssetUploadResult, AiPatch } from '../../../functions/_lib/types'
export type { AdminUserSummary, AssetUploadResult, AiPatch }
