import { withEnv } from '../../../_lib/env'
import { jsonError, jsonOk, clientIp, rateLimit } from '../../../_lib/http'
import { requireEditToken, isResponse } from '../../../_lib/auth'
import { analyzeWithLlm } from '../../../_lib/llm'
import type { AiPatch } from '../../../_lib/llm'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
  params: { userId: string }
}

const MAX_DOC_MB = 2
const ALLOWED_DOC_MIME = new Set(['text/plain', 'text/markdown', ''])

/**
 * POST /api/space/:userId/ai-analyze — 上传文档（md/txt，或前端已抽取的纯文本），
 * 调 LLM 分析并把关键信息分配到当前页区块，返回 patches（前端确认后逐块应用）。
 * 文档属临时输入，不 commit 到 GitHub。
 */
export const onRequestPost = withEnv<PagesContext>(async ({ request }, env) => {
  const url = new URL(request.url)
  const auth = await requireEditToken(request, url, env)
  if (isResponse(auth)) return auth

  // LLM 可选配置：未配置时明确 501
  if (!env.LLM_BASE_URL || !env.LLM_API_KEY || !env.LLM_MODEL) {
    return jsonError('LLM_NOT_CONFIGURED', '未配置 LLM 环境变量（LLM_BASE_URL / LLM_API_KEY / LLM_MODEL）', 501)
  }

  if (!rateLimit(`ai-analyze:${clientIp(request)}`, 10, 60_000)) {
    return jsonError('RATE_LIMITED', '请求过于频繁，请稍后再试', 429)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('INVALID_INPUT', '请求必须是 multipart/form-data', 400)
  }

  // 文档文本：file（md/txt）或 text（前端 pdfjs 抽取）二选一
  let text = typeof form.get('text') === 'string' ? (form.get('text') as string) : ''
  const file = form.get('file')
  if (!text && file instanceof File) {
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      return jsonError('INVALID_INPUT', `文件超过 ${MAX_DOC_MB}MB 上限`, 400)
    }
    if (!ALLOWED_DOC_MIME.has(file.type) && !/\.(md|txt|markdown)$/i.test(file.name)) {
      return jsonError('INVALID_INPUT', '仅支持 md/txt 文件（pdf 请由前端抽取文本后提交）', 400)
    }
    text = await file.text()
  }
  text = text.trim()
  if (!text) {
    return jsonError('INVALID_INPUT', '缺少文档内容（字段 file 或 text）', 400)
  }

  // 当前页区块骨架
  let blocks: Array<{ index: number; type: string; data: Record<string, unknown> }>
  try {
    const raw = JSON.parse(String(form.get('blocks'))) as unknown
    if (!Array.isArray(raw)) throw new Error('not array')
    blocks = raw.map((b, index) => {
      const block = b as { type?: unknown; data?: unknown }
      if (typeof block.type !== 'string' || typeof block.data !== 'object' || block.data === null) {
        throw new Error('bad block')
      }
      return { index, type: block.type, data: block.data as Record<string, unknown> }
    })
  } catch {
    return jsonError('INVALID_INPUT', 'blocks 字段必须是 [{ type, data }] 的 JSON 数组', 400)
  }
  if (blocks.length === 0) {
    return jsonError('INVALID_INPUT', '当前页面没有区块可填充', 400)
  }

  try {
    const result = await analyzeWithLlm(
      { LLM_BASE_URL: env.LLM_BASE_URL, LLM_API_KEY: env.LLM_API_KEY, LLM_MODEL: env.LLM_MODEL },
      text,
      blocks,
    )
    return jsonOk<{ patches: AiPatch[]; notes: string }>(result)
  } catch (err) {
    return jsonError('LLM_ERROR', err instanceof Error ? err.message : 'LLM 分析失败', 502)
  }
})
