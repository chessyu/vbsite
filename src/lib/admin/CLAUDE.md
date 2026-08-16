# src/lib/admin/ — Admin 浏览器侧基础设施

admin 前端的 API 封装与 token UX 解析（无 React 依赖）。

## 文件

- `api.ts` — fetch 封装：统一响应包解析、`ApiError`、`adminApi`（登录/列表/编辑链接）、`spaceApi`（读/发布/上传）。type-only 引入 `functions/_lib/types` 的 DTO（无运行时耦合）。
- `editToken.ts` — 纯 UX 层解析 token payload（读 exp 做倒计时/过期提示）。**不验签**——密钥在服务端，真正的鉴权全在 Functions。
- `videoTranscode.ts` — ffmpeg.wasm 浏览器内视频转码（scroll-scrub 前提：`-g 8` 短关键帧 + ≤8MB + faststart）+ 首帧海报提取。wasm core 从 unpkg CDN 懒加载（单线程版，避免全站 COOP/COEP）；>8MB 自动 crf 20→26 重试一轮。

## 约定

- admin session 走 HttpOnly Cookie（同源自动携带）；edit token 显式拼 query。
- 不要在此目录放密钥或敏感配置。
