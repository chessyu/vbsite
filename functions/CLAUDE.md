# functions/ — Cloudflare Pages Functions（服务端）

VBSite 的服务端。承担 admin 模块的一切需要密钥/写权限的逻辑：token 鉴权、GitHub 提交（触发 Pages 自动构建）、资源上传。**浏览器永远接触不到密钥。**

## 路由映射约定

Pages Functions 按文件路径生成路由：

```
functions/api/admin/login.ts   → POST /api/admin/login
functions/api/space/[userId].ts → GET /api/space/:userId
```

- API 全部挂 `/api/*`（不挂 `/admin/*`——Functions 优先级高于静态资源，会拦截前端 SPA 路由）
- `_lib/` 的 `_` 前缀 = 不生成路由，只放共享模块

## 目录结构

| 路径 | 职责 |
|---|---|
| `_lib/env.ts` | 环境变量解析 + 默认值 + 缺失报错（`withEnv` 包装器） |
| `_lib/token.ts` | HMAC-SHA256 无状态 token 签发/校验（Web Crypto，格式 `v1.<b64url(payload)>.<b64url(sig)>`） |
| `_lib/auth.ts` | `requireAdmin`（Cookie session）/ `requireEditToken`（query token 或 admin 回落）守卫 |
| `_lib/github.ts` | GitHub API 封装：`readSpace` / `listUserDirs` / `commitFiles`（Git Trees 单 commit） |
| `_lib/http.ts` | `jsonOk`/`jsonError` 响应助手 + 内存级限速 |
| `_lib/types.ts` | API DTO 类型（前端 type-only import 引用） |

## 端点清单

| Method | Path | 鉴权 | 职责 |
|---|---|---|---|
| POST | `/api/admin/login` | 无（限速 5次/分/IP） | 密码登录，签发 HttpOnly Cookie `vb_admin` |
| POST | `/api/admin/logout` | 无 | 清 Cookie |
| GET | `/api/admin/session` | 无 | 探测登录状态 |
| GET | `/api/admin/users` | admin | 列出客户 |
| POST | `/api/admin/edit-link` | admin | 生成临时编辑链接（默认 24h，上限 168h） |
| GET | `/api/space/:userId` | edit token / admin | 读 space.json（**统一从 GitHub 读**） |
| PUT | `/api/space/:userId/publish` | edit token / admin | 严格校验后单 commit 提交 |
| POST | `/api/space/:userId/assets` | edit token / admin | 图片/视频上传到 `users/<id>/assets/`，立即单独 commit |

## 关键设计决策

1. **Git Trees API 单 commit**（不用逐文件 Contents PUT）：原子性 + 一次 push 只触发一次 Pages 构建。图片上传立即单独 commit，publish 通常只剩 space.json。
2. **读取数据源统一为 GitHub**：`.gitignore` 忽略大部分 `users/*`，新用户本地无文件；且保证编辑基线是已部署最新版。
3. **无 token / 过期 / 用户不存在统一 404 语义**（前端不区分原因，防探测）。
4. **发布校验**：`parseSpaceConfigStrict`（相对路径 import `src/lib/spaceSchema`，Functions esbuild 无 `@` 别名）+ `username === userId` 一致性检查。

## 环境变量

见根目录 `.env.example`。本地开发放 `.dev.vars`（已 gitignore）；线上配 Pages Dashboard（Production + Preview 各一份）。

## 本地调试

```bash
npm run dev                    # 终端 1：vite :5173
npm run dev:functions          # 终端 2：wrangler pages dev --proxy 5173 --port 8788
# 浏览器打开 http://localhost:8788
```

线上日志：`npx wrangler pages deployment tail`。

## 约定

- 共享代码进 `_lib/`，端点文件只做「解析入参 → 鉴权 → 调 _lib → 包响应」。
- 统一响应包：`{ ok: true, data }` / `{ ok: false, error: { code, message } }`。
- 二期规划：`api/llm/[action].ts`（OpenAI 兼容接口代理：analyze/rewrite）。
