# blocks/video-hero — 电影感滚动视频首屏

10k-websites 方法论落地：滚动驱动视频正放/倒放（scroll-scrub）+ 分段字幕带 + 四层可读性系统 + 五档静态降级。

## 文件

- `VideoHeroBlock.tsx` — 组件（stage 分层 + 静态降级分支 + 进度环）
- `types.ts` — `VideoHeroBlockData`（zod schema 单一来源）
- `staticFallback.ts` — 五档降级门 query 常量（JS/CSS 单一来源）
- `useVideoLoader.ts` — 视频 Blob 加载（流式 + watchdog）
- `useVideoScrub.ts` — scrub 引擎（ScrollTrigger + seek 门控 + 字幕 delta 更新）

## 数据结构

```ts
interface Caption { text; from: 0–1; to: 0–1; position: center|left|right|bottom; size: lg|md|sm; kicker? }
interface VideoHeroBlockData {
  video: { url, bytes? }   // bytes 供前端决定直接 fetch vs 流式进度环
  poster: string           // 静态降级与加载中的底图
  heightVh: 200–800 (默认 400)  // 滚动轨道高度
  captions: Caption[]
  fallbackHeading / fallbackSub  // 降级 hero 文案；电影模式下 heading 作 sr-only h1
  cta?: { label, href }   // 结尾静置与降级共用
  overlayTint?: string
}
```

## 架构要点

- **滚动轨道**：外层 `heightVh` 容器 + 内层 `sticky top-0 h-[100svh]`（CSS sticky，**不用 ScrollTrigger pin**——项目既有约定）。ScrollTrigger 只算 progress（`start:'top top', end:'bottom bottom'`）。
- **lerp 平滑**：`scrub: 1` 的 catch-up 即 lerp，不自建 rAF；ticker 驱动、离屏自动停转、useGSAP revert 自动 cleanup。
- **seek 门控**（useVideoScrub）：locked + pending 合并最新 + seeked 解锁 + 500ms 超时保险 + 帧差 <0.033s 跳过。**字幕更新与 seek 解耦**（onUpdate 直做），滚动永远即时。
- **分层原则**：React 管结构（字幕条目/模式切换），scrub 循环直写样式（opacity/--k/currentTime），帧级更新不走 setState。
- **四层可读性**：全局径向 scrim（静态 CSS）→ per-caption scrim（`--k` 驱动）→ 三层 text-shadow → kicker chip 胶囊。CSS 在组件内 `<style>`（scoped class vh-*）。
- **五档静态门**（staticFallback.ts）：手机 ≤720px / 竖屏平板 ≤1024px / coarse 竖屏 / 横屏矮窗 ≤560 / reduce。**JS 与 CSS 字符级同源 + matchMedia change live 重评估**；poster 由 JS 在电影模式代码路径设置——降级档 0 视频字节。
- **Blob 加载**：防托管无 HTTP Range（seek 钳 0）；<8MB 直接 blob，否则流式 + SVG 进度环 + 20s watchdog → error 降级 poster 兜底。

## 约定

- 视频必须经 ffmpeg 预处理：`-g 8 -keyint_min 8`（短关键帧间隔，否则 scrub 卡顿）+ 压到 ≤8MB。admin 上传链路用 ffmpeg.wasm 自动完成（`src/lib/admin/videoTranscode.ts`）。
- video 元素 `aria-hidden + tabIndex=-1`（装饰性）；标题语义由 sr-only h1 承担。
- 从 `@/lib/gsap` import；不动 layout 属性。
