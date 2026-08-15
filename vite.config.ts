import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'

// generate 命令通过环境变量注入用户空间数据
const isGenerate = !!process.env.VITE_BUILD_USER

// 自定义 Vite 插件：dev 模式下将 /users/* 请求映射到 users/ 目录
function serveUsersDir() {
  return {
    name: 'serve-users-dir',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url?.startsWith('/users/')) {
          const filePath = path.resolve(__dirname, req.url.slice(1))
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            fs.createReadStream(filePath).pipe(res)
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    serveUsersDir(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
})
