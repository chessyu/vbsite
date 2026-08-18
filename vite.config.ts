import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'

// generate 命令通过环境变量注入用户空间数据
const isGenerate = !!process.env.VITE_BUILD_USER

/** 静态资源 MIME 映射（dev 中间件流式响应用） */
const MIME: Record<string, string> = {
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

interface GithubCfg {
  pat: string
  repo: string
  branch: string
}

/**
 * 自定义 Vite 插件：dev 模式下服务 /users/*。
 *
 * 数据源优先级（关键：编辑/发布链路写的是 GitHub 远端，本地文件可能落后）：
 * - /users/<id>/space.json → GitHub raw 优先（发布后 dev 立即可见），失败回落本地 users/
 * - /users/<id>/assets/** → 本地 users/<id>/assets/ 优先（无网络开销），
 *   miss 时回落 GitHub raw（本地未 pull 远端上传的资产也能加载）
 * - 未配置 GITHUB_PAT 时整体退化为纯本地模式（现状行为）
 */
function serveUsersDir(cfg: GithubCfg) {
  const ghRaw = (repoPath: string) =>
    `https://raw.githubusercontent.com/${cfg.repo}/${cfg.branch}/${repoPath}`
  const ghHeaders = () =>
    cfg.pat
      ? { Authorization: `Bearer ${cfg.pat}`, 'User-Agent': 'vbsite-dev' }
      : undefined

  const serveLocal = (res: ServerResponse, filePath: string): boolean => {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false
    const ext = path.extname(filePath).toLowerCase()
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    fs.createReadStream(filePath).pipe(res)
    return true
  }

  /** GitHub raw 代理：成功转发，失败返回 false 让调用方回落 */
  const serveRemote = async (res: ServerResponse, repoPath: string): Promise<boolean> => {
    if (!cfg.pat) return false
    try {
      const upstream = await fetch(ghRaw(repoPath), {
        headers: ghHeaders(),
        cache: 'no-store',
      })
      if (!upstream.ok || !upstream.body) return false
      const ext = path.extname(repoPath).toLowerCase()
      res.setHeader('Content-Type', upstream.headers.get('content-type') ?? MIME[ext] ?? 'application/octet-stream')
      res.setHeader('Cache-Control', 'no-store')
      const buf = await upstream.arrayBuffer()
      res.end(Buffer.from(buf))
      return true
    } catch {
      return false
    }
  }

  return {
    name: 'serve-users-dir',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/users/')) return next()
        // 去掉 query、防路径穿越（%2e%2e / ..）
        const clean = req.url.split('?')[0].replace(/\/+/g, '/')
        if (clean.includes('..')) return next()
        const repoPath = clean.slice(1) // users/<id>/...

        // assets：本地优先，远端兜底（上传后本地没有这些文件）
        if (repoPath.startsWith('users/') && repoPath.includes('/assets/')) {
          if (serveLocal(res, path.resolve(__dirname, repoPath))) return
          void serveRemote(res, repoPath).then(ok => {
            if (!ok) next()
          })
          return
        }

        // space.json：远端优先（发布写远端，本地必然落后），失败回落本地
        if (repoPath.endsWith('/space.json')) {
          void serveRemote(res, repoPath).then(ok => {
            if (ok) return
            if (serveLocal(res, path.resolve(__dirname, repoPath))) return
            next()
          })
          return
        }

        // 其余（历史 images/videos 路径等）：本地文件直接服务（保持旧行为）
        if (serveLocal(res, path.resolve(__dirname, repoPath))) return
        next()
      })
    },
  }
}

/**
 * 构建产物拷贝：users/ → dist/users/。
 * Vite 只拷 public/，而 space.json 与 assets/ 在仓库根 users/ 下——
 * 不拷贝的话线上 /users/<id>/space.json 会命中 _redirects 返回 index.html。
 * generate 模式（单用户构建）由 scripts/generate.cjs 自管 dist，跳过。
 */
function copyUsersToDist() {
  return {
    name: 'copy-users-to-dist',
    closeBundle() {
      if (isGenerate) return
      const src = path.resolve(__dirname, 'users')
      const dest = path.resolve(__dirname, 'dist/users')
      if (!fs.existsSync(src)) return
      fs.cpSync(src, dest, { recursive: true })
    },
  }
}

export default defineConfig(({ mode }) => {
  // GITHUB_* 均为服务端变量（无 VITE_ 前缀，不进浏览器 bundle），仅 dev 中间件在 Node 侧使用
  const env = loadEnv(mode, __dirname, '')
  const cfg: GithubCfg = {
    pat: env.GITHUB_PAT ?? '',
    repo: env.GITHUB_REPO ?? '',
    branch: env.GITHUB_BRANCH ?? 'main',
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      serveUsersDir(cfg),
      copyUsersToDist(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      // @ffmpeg/ffmpeg 内部用 new Worker(new URL('./worker.js', import.meta.url)) 加载 worker，
      // 预打包（esbuild 转成单文件）会破坏这条 URL 解析路径，导致 worker 404/加载失败。必须排除。
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    server: {
      proxy: {
        // 本地调试 Pages Functions（wrangler pages dev --proxy 5173 --port 8788）时，
        // 让只开 5173 的场景也能访问 /api/*
        '/api': 'http://localhost:8788',
      },
    },
    // 单用户构建使用相对路径，客户可能放在任何域名下
    base: isGenerate ? './' : '/',
    build: {
      // 单用户构建不需要 code splitting
      rollupOptions: isGenerate ? {
        output: {
          manualChunks: undefined,
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      } : undefined,
    },
  }
})
