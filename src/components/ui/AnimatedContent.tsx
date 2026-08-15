import React, { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/**
 * 全站统一的滚动/入场动画容器（基于 GSAP 官方最佳实践）。
 *
 * 规范要点（来自 gsap-skills）：
 * - 使用 useGSAP() + scope，自动 cleanup，无内存泄漏。
 * - 只动 transform(x/y/scale) + opacity（autoAlpha），不触发布局，保持 60fps。
 * - 首屏可见元素走 timeline 直接播放；折叠区元素挂 ScrollTrigger，避免首屏闪现与节奏打架。
 * - 支持 stagger：传入时对直接子元素逐个入场，替代外部手动 delay={i*100}。
 * - 尊重 prefers-reduced-motion：降级为直接显示，无动画。
 */
interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** 仅对直接子元素生效；开启后按 stagger 逐个入场 */
  stagger?: number;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: string;
  /** 初始透明度，默认 0 */
  initialOpacity?: number;
  /** 是否动画透明度，默认 true */
  animateOpacity?: boolean;
  scale?: number;
  /** ScrollTrigger 触发阈值：元素顶部进入视口多少比例时播放。默认 85（%） */
  threshold?: number;
  /** 整体延迟（毫秒）。首屏编排时用于在 timeline 中排队 */
  delay?: number;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  stagger = 0,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 85,
  delay = 0,
  className = '',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const axis = direction === 'horizontal' ? 'x' : 'y';
      const offset = reverse ? -distance : distance;

      // 决定动画目标：stagger 模式下对直接子元素，否则对容器本身。
      const useStagger = stagger > 0 && el.children.length > 1;
      const targets: Element[] = useStagger ? Array.from(el.children) : [el];

      // 终态 tween（各档共用，移动端在下方按档调整强度）。
      const tweenVars: gsap.TweenVars = {
        [axis]: 0,
        scale: 1,
        autoAlpha: 1,
        duration,
        ease,
        delay: delay / 1000, // delay 入参为毫秒，转换为 GSAP 的秒
        stagger: useStagger ? stagger : 0,
      };

      // 响应式 + 降级：三档 matchMedia 统一全站动效强度。
      // isMobile 档 distance/stagger/duration 减半，保证秒开流畅。
      const mm = gsap.matchMedia();
      mm.add(
        {
          isDesktop:
            '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          isMobile:
            '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { reduce, isMobile } = ctx.conditions as {
            isDesktop: boolean
            isMobile: boolean
            reduce: boolean
          }

          if (reduce) {
            gsap.set(targets, { [axis]: 0, scale: 1, autoAlpha: 1 })
            return
          }

          // 初始态：autoAlpha 合并 visibility + opacity，避免首帧闪现。
          // 移动端位移减半，节奏更轻快。
          const initialOffset = isMobile ? (offset as number) * 0.5 : offset
          gsap.set(targets, {
            [axis]: initialOffset,
            scale,
            autoAlpha: animateOpacity ? initialOpacity : 1,
          })

          // 移动端 stagger/duration 缩减。
          const effectiveTween: gsap.TweenVars = {
            ...tweenVars,
            duration: isMobile ? Math.min(duration, 0.5) : duration,
            stagger: useStagger ? (isMobile ? Math.min(stagger, 0.08) : stagger) : 0,
          }

          // 判断元素是否在首屏可见：是则直接 timeline 播放（节奏由 delay/stagger 统一编排），
          // 否则挂 ScrollTrigger 滚动入场。
          const rect = el.getBoundingClientRect()
          const inInitialViewport = rect.top < window.innerHeight * (threshold / 100)

          if (inInitialViewport) {
            gsap.to(targets, effectiveTween)
          } else {
            gsap.to(targets, {
              ...effectiveTween,
              scrollTrigger: {
                trigger: el,
                start: `top ${threshold}%`,
                once: true,
              },
            })
          }
        },
      )
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  );
};

export default AnimatedContent;
