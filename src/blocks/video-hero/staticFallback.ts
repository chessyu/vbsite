/**
 * 静态降级门 — JS 与 CSS 的单一来源。
 *
 * 命中的访客看静态海报 hero（不下载任何视频字节）：
 * 1. 横屏矮窗（手机横过来）≤560px 高
 * 2. prefers-reduced-motion
 *
 * 历史：原五档门含手机 ≤720px / 竖屏平板 / 触屏竖屏三档（移动端不播视频）。
 * 产品决策（移动端为核心获客渠道）：移动端也播 scrub 视频，故只剩上述两档。
 * 视频经 admin 上传链路 ffmpeg 压到 ≤8MB，流量可控。
 *
 * 关键约定（来自 10k-websites 实战教训）：
 * - CSS media query 与 JS 判断必须**字符级一致**，否则一侧加载资源另一侧隐藏，出现空白或白下视频流量；
 * - 必须**live 重评估**（监听 change）：旋转设备 / 拖大窗口 / 中途开关 reduce，一次性判断会留下空白 hero。
 */

/** JS 侧：matchMedia 用的完整 query 字符串 */
export const STATIC_FALLBACK_QUERY = [
  '(max-height: 560px) and (orientation: landscape)',
  '(prefers-reduced-motion: reduce)',
].join(', ')

/** reduce 档单独拆出：reduce 用户连滚动字幕动画也不做（纯静态） */
export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'
