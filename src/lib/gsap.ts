/**
 * 全站 GSAP 统一注册入口（单一 import 源）。
 *
 * 规范要点（gsap-skills / gsap-react）：
 * - registerPlugin 幂等，集中到此处避免分散重复注册，便于维护与 tree-shaking 审计。
 * - 此模块作为副作用模块：谁用到 GSAP 就 import 它，Vite 自动按需打包；
 *   同时 main.tsx 顶部 import 一次，保证路由切换前插件已就绪。
 * - 不使用 React Context：插件注册是全局副作用，与渲染树无关，纯模块级更轻量，
 *   且 StrictMode 双渲染天然兼容。
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, Observer, useGSAP)

export { gsap, ScrollTrigger, SplitText, Observer, useGSAP }
