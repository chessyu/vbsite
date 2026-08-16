import { withEnv } from '../../../_lib/env'
import { jsonError, jsonOk, readJson } from '../../../_lib/http'
import { requireEditToken, isResponse } from '../../../_lib/auth'
import { commitFiles } from '../../../_lib/github'
// 相对路径 import（与 spaceSchema.ts 头部注释的 tsx 约束同理，Functions esbuild 无 @ 别名）
import { parseSpaceConfigStrict } from '../../../../src/lib/spaceSchema'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
  params: { userId: string }
}

/**
 * PUT /api/space/:userId/publish — 发布 space.json。
 * 发布前严格校验（parseSpaceConfigStrict），把 generate.cjs 构建期拦截的保证前移到发布入口。
 */
export const onRequestPut = withEnv<PagesContext>(async ({ request, params }, env) => {
  const url = new URL(request.url)
  const auth = await requireEditToken(request, url, env)
  if (isResponse(auth)) return auth

  const body = await readJson<{ config?: unknown; message?: string }>(request)
  if (!body || typeof body !== 'object' || body.config === undefined) {
    return jsonError('INVALID_INPUT', '缺少 config', 400)
  }

  // 1. 严格校验（未知 block type / data 缺字段均拒绝）
  const parsed = parseSpaceConfigStrict(body.config)
  if (!parsed.ok) {
    return jsonError('INVALID_INPUT', `配置校验失败：\n${parsed.issues.join('\n')}`, 400)
  }

  // 2. username 一致性检查（与 scripts/generate.cjs 的检查对齐）
  if (parsed.config.space.username !== params.userId) {
    return jsonError(
      'INVALID_INPUT',
      `config.space.username（${parsed.config.space.username}）与目标用户（${params.userId}）不一致`,
      400,
    )
  }

  // 3. 剥离会话级预览数据（blob URL 只在编辑器会话内有意义，不得入库）
  for (const page of parsed.config.pages) {
    for (const block of page.blocks) {
      const data = block.data as Record<string, unknown> | undefined
      if (!data) continue
      const video = data.video as Record<string, unknown> | undefined
      if (video && 'previewUrl' in video) delete video.previewUrl
      if ('posterPreviewUrl' in data) delete data.posterPreviewUrl
    }
  }

  // 4. 单 commit 提交（JSON 2 空格缩进，与仓库现有格式一致）
  const content = JSON.stringify(parsed.config, null, 2)
  const result = await commitFiles(
    env,
    [{ path: `users/${params.userId}/space.json`, content, encoding: 'utf-8' }],
    body.message?.trim() || `chore(admin): 更新 ${params.userId} 的 space.json`,
  )
  if (isResponse(result)) return result

  return jsonOk({ commitSha: result.commitSha, htmlUrl: result.htmlUrl })
})
