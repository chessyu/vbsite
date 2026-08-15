/** API DTO 类型 — 前端通过 type-only import 引用，无运行时耦合 */

export interface AdminUserSummary {
  userId: string
  displayName: string | null
  updatedAt: string | null
}

export interface AssetUploadResult {
  /** 可写入 space.json 的绝对路径，如 /users/xxx/images/avatar-a1b2c3.jpg */
  path: string
  /** 编辑会话内预览用的 data URL */
  dataUrl: string
  bytes: number
}

export interface EditLinkResult {
  url: string
  token: string
  expiresAt: number
}

export interface PublishResult {
  commitSha: string
  htmlUrl: string
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_INPUT'
  | 'GITHUB_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
