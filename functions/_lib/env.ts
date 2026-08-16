/** 环境变量解析 + 默认值；必填项缺失时抛出（返回 500，避免静默裸奔） */

export interface AdminEnv {
  ADMIN_PASSWORD: string
  ADMIN_TOKEN_SECRET: string
  EDIT_LINK_TTL_HOURS: number
  ADMIN_SESSION_TTL_HOURS: number
  GITHUB_PAT: string
  GITHUB_REPO: string
  GITHUB_BRANCH: string
  MAX_ASSET_MB: number
  VIDEO_MAX_MB: number
}

export function getEnv(context: { env: Record<string, unknown> }): AdminEnv {
  const env = context.env ?? {}
  const require = (name: string): string => {
    const value = env[name]
    if (typeof value !== 'string' || !value) {
      throw new Error(`缺少环境变量 ${name}（Pages Dashboard → Settings → Environment variables，本地放 .dev.vars）`)
    }
    return value
  }
  const optional = (name: string, fallback: number): number => {
    const value = env[name]
    const parsed = typeof value === 'string' ? Number(value) : Number.NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  return {
    ADMIN_PASSWORD: require('ADMIN_PASSWORD'),
    ADMIN_TOKEN_SECRET: require('ADMIN_TOKEN_SECRET'),
    EDIT_LINK_TTL_HOURS: optional('EDIT_LINK_TTL_HOURS', 24),
    ADMIN_SESSION_TTL_HOURS: optional('ADMIN_SESSION_TTL_HOURS', 12),
    GITHUB_PAT: require('GITHUB_PAT'),
    GITHUB_REPO: require('GITHUB_REPO'),
    GITHUB_BRANCH: (env.GITHUB_BRANCH as string) || 'main',
    MAX_ASSET_MB: optional('MAX_ASSET_MB', 10),
    VIDEO_MAX_MB: optional('VIDEO_MAX_MB', 50),
  }
}

/** 包装 handler：env 缺失时返回 500 而非未捕获异常 */
export function withEnv<T extends { env: Record<string, unknown> }>(
  handler: (ctx: T, env: AdminEnv) => Promise<Response> | Response,
) {
  return async (ctx: T): Promise<Response> => {
    let env: AdminEnv
    try {
      env = getEnv(ctx)
    } catch (err) {
      return Response.json(
        { ok: false, error: { code: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'env 配置错误' } },
        { status: 500 },
      )
    }
    return handler(ctx, env)
  }
}
