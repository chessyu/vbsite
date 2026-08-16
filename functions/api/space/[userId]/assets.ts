import { withEnv } from '../../../_lib/env'
import { jsonError, jsonOk } from '../../../_lib/http'
import { requireEditToken, isResponse } from '../../../_lib/auth'
import { commitFiles } from '../../../_lib/github'
import type { AssetUploadResult } from '../../../_lib/types'

interface PagesContext {
  request: Request
  env: Record<string, unknown>
  params: { userId: string }
}

const IMAGE_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
}

const VIDEO_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

/** 文件名 slug 化 + 随机后缀，防覆盖冲突与非 ASCII 路径问题 */
function assetName(original: string, ext: string): string {
  const base = original
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'asset'
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}.${ext}`
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * POST /api/space/:userId/assets — 上传图片到 public/users/<userId>/images/，
 * 立即单独 commit（这样 publish 通常只剩 space.json 一个文件，重试成本低；
 * 中间态只是「多一张未引用的图」，无数据风险）。
 * 响应同时返回 base64 data URL 供编辑会话内预览。
 */
export const onRequestPost = withEnv<PagesContext>(async ({ request, params }, env) => {
  const url = new URL(request.url)
  const auth = await requireEditToken(request, url, env)
  if (isResponse(auth)) return auth

  const maxBytes = env.MAX_ASSET_MB * 1024 * 1024
  const videoMaxBytes = env.VIDEO_MAX_MB * 1024 * 1024

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonError('INVALID_INPUT', '请求必须是 multipart/form-data', 400)
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return jsonError('INVALID_INPUT', '缺少文件（字段名 files）', 400)
  }
  if (files.length > 10) {
    return jsonError('INVALID_INPUT', '单次最多上传 10 个文件', 400)
  }

  const results: AssetUploadResult[] = []
  const entries = []

  for (const file of files) {
    const isVideo = file.type in VIDEO_MIME
    const ext = IMAGE_MIME[file.type] ?? VIDEO_MIME[file.type]
    if (!ext) {
      return jsonError('INVALID_INPUT', `不支持的文件类型：${file.type || '未知'}（仅支持图片/视频）`, 400)
    }
    // 视频单独上限（较大），图片维持 MAX_ASSET_MB
    const fileMaxBytes = isVideo ? videoMaxBytes : maxBytes
    const fileMaxLabel = isVideo ? env.VIDEO_MAX_MB : env.MAX_ASSET_MB
    if (file.size > fileMaxBytes) {
      return jsonError('INVALID_INPUT', `文件 ${file.name} 超过 ${fileMaxLabel}MB 上限`, 400)
    }

    const buffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(buffer)
    const dir = isVideo ? 'videos' : 'images'
    const path = `public/users/${params.userId}/${dir}/${assetName(file.name, ext)}`

    entries.push({ path, content: base64, encoding: 'base64' as const })
    results.push({
      path: `/${path.replace(/^public\//, '')}`,
      // 视频不回 base64 dataUrl（大体积会撑爆编辑器内存与 postMessage），会话内预览用本地 blob
      dataUrl: isVideo ? undefined : `data:${file.type};base64,${base64}`,
      bytes: file.size,
    })
  }

  const commit = await commitFiles(env, entries, `chore(admin): 上传 ${params.userId} 的资源 ×${entries.length}`)
  if (isResponse(commit)) return commit

  return jsonOk({ files: results, commitSha: commit.commitSha })
})
