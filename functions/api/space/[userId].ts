import { withEnv } from '../../_lib/env'
import { jsonError, jsonOk } from '../../_lib/http'
import { requireEditToken, isResponse } from '../../_lib/auth'
import { readSpace } from '../../_lib/github'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
  params: { userId: string }
}

/**
 * GET /api/space/:userId?token= — 读取 space.json（统一从 GitHub 读，
 * 保证编辑基线是已部署最新版；本地文件可能因 .gitignore 不存在）。
 * 未授权/用户不存在统一 404（防探测，前端渲染 404 页面）。
 */
export const onRequestGet = withEnv<PagesContext>(async ({ request, params }, env) => {
  const url = new URL(request.url)
  const auth = await requireEditToken(request, url, env)
  if (isResponse(auth)) return auth

  const space = await readSpace(env, params.userId)
  if (isResponse(space)) return space
  if (!space) {
    return jsonError('NOT_FOUND', '用户不存在', 404)
  }

  let config: unknown
  try {
    config = JSON.parse(space.content)
  } catch {
    return jsonError('GITHUB_ERROR', 'space.json 不是合法 JSON', 502)
  }
  return jsonOk({ config, sha: space.sha })
})
