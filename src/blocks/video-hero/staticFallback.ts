/**
 * 五档静态降级门 — JS 与 CSS 的单一来源。
 *
 * 命中任意一档的访客看静态海报 hero（不下载任何视频字节）：
 * 1. 手机 ≤720px
 * 2. 竖屏平板 ≤1024px
 * 3. 粗指针（触屏）竖屏
 * 4. 横屏矮窗（手机横过来）≤560px 高
 * 5. prefers-reduced-motion
 *
 * 关键约定（来自 10k-websites 实战教训）：
 * - CSS media query 与 JS 判断必须**字符级一致**，否则一侧加载资源另一侧隐藏，出现空白或白下视频流量；
 * - 必须**live 重评估**（监听 change）：旋转设备 / 拖大窗口 / 中途开关 reduce，一次性判断会留下空白 hero。
 */

/** JS 侧：matchMedia 用的完整 query 字符串 */
export const STATIC_FALLBACK_QUERY = [
  '(max-width: 720px)',
  '(max-width: 1024px) and (orientation: portrait)',
  '(pointer: coarse) and (orientation: portrait)',
  '(max-height: 560px) and (orientation: landscape)',
  '(prefers-reduced-motion: reduce)',
].join(', ')
