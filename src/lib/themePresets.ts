import type { ThemeConfig } from './spaceSchema'

/**
 * 预设主题套系 — 纯数据，无 React。
 * textColor 等为 Tailwind 类名；background / primaryGradient 为 CSS 值或 Tailwind 渐变类（同一套内保持风格一致）。
 * ThemeForm 渲染为可直接点选的卡片，不再提供自定义表单。
 */

export interface ThemePreset {
  id: string
  name: string
  theme: ThemeConfig
  /** 卡片色卡（hex，用于小色块展示） */
  swatch: string[]
}

export const themePresets: ThemePreset[] = [
  {
    id: 'warm',
    name: '暖阳',
    theme: {
      mode: 'light',
      background: 'linear-gradient(180deg, #fef3c7 0%, #fff7ed 50%, #fce7f3 100%)',
      textColor: 'text-stone-900',
      subTextColor: 'text-stone-600',
      mutedTextColor: 'text-stone-500',
      primaryGradient: 'from-warm-500 to-accent-pink-500',
      auroraColors: ['#fbbf24', '#f472b6'],
    },
    swatch: ['#fef3c7', '#fbbf24', '#f472b6', '#fce7f3'],
  },
  {
    id: 'minimal',
    name: '极简白',
    theme: {
      mode: 'light',
      background: '#fafaf9',
      textColor: 'text-stone-900',
      subTextColor: 'text-stone-500',
      mutedTextColor: 'text-stone-400',
      primaryGradient: 'from-stone-700 to-stone-900',
      auroraColors: undefined,
    },
    swatch: ['#fafaf9', '#78716c', '#292524', '#a8a29e'],
  },
  {
    id: 'coast',
    name: '海岸蓝',
    theme: {
      mode: 'light',
      background: 'linear-gradient(180deg, #eff6ff 0%, #f0f9ff 50%, #ecfeff 100%)',
      textColor: 'text-slate-900',
      subTextColor: 'text-slate-600',
      mutedTextColor: 'text-slate-400',
      primaryGradient: 'from-sky-500 to-cyan-400',
      auroraColors: ['#38bdf8', '#22d3ee'],
    },
    swatch: ['#eff6ff', '#38bdf8', '#22d3ee', '#ecfeff'],
  },
  {
    id: 'forest',
    name: '森林绿',
    theme: {
      mode: 'light',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #f7fee7 100%)',
      textColor: 'text-stone-900',
      subTextColor: 'text-stone-600',
      mutedTextColor: 'text-stone-400',
      primaryGradient: 'from-emerald-500 to-lime-500',
      auroraColors: ['#34d399', '#a3e635'],
    },
    swatch: ['#f0fdf4', '#34d399', '#a3e635', '#f7fee7'],
  },
  {
    id: 'lavender',
    name: '薰衣草',
    theme: {
      mode: 'light',
      background: 'linear-gradient(180deg, #faf5ff 0%, #f5f3ff 50%, #fdf4ff 100%)',
      textColor: 'text-stone-900',
      subTextColor: 'text-stone-600',
      mutedTextColor: 'text-stone-400',
      primaryGradient: 'from-violet-500 to-fuchsia-500',
      auroraColors: ['#a78bfa', '#e879f9'],
    },
    swatch: ['#faf5ff', '#a78bfa', '#e879f9', '#fdf4ff'],
  },
  {
    id: 'midnight',
    name: '午夜',
    theme: {
      mode: 'dark',
      background: '#0c0a09',
      textColor: 'text-stone-100',
      subTextColor: 'text-stone-400',
      mutedTextColor: 'text-stone-500',
      primaryGradient: 'from-amber-400 to-orange-500',
      auroraColors: ['#f59e0b', '#f97316'],
    },
    swatch: ['#0c0a09', '#fbbf24', '#f97316', '#44403c'],
  },
  {
    id: 'deepsea',
    name: '深海',
    theme: {
      mode: 'dark',
      background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
      textColor: 'text-slate-100',
      subTextColor: 'text-slate-400',
      mutedTextColor: 'text-slate-500',
      primaryGradient: 'from-sky-400 to-indigo-500',
      auroraColors: ['#38bdf8', '#818cf8'],
    },
    swatch: ['#020617', '#38bdf8', '#818cf8', '#1e293b'],
  },
  {
    id: 'neon',
    name: '霓虹',
    theme: {
      mode: 'dark',
      background: '#09090b',
      textColor: 'text-zinc-100',
      subTextColor: 'text-zinc-400',
      mutedTextColor: 'text-zinc-500',
      primaryGradient: 'from-fuchsia-500 to-cyan-400',
      auroraColors: ['#d946ef', '#22d3ee'],
    },
    swatch: ['#09090b', '#d946ef', '#22d3ee', '#3f3f46'],
  },
]

/** 当前 theme 是否与某预设完全一致（字段序不敏感） */
export function matchPreset(theme: ThemeConfig): ThemePreset | null {
  const normalize = (t: ThemeConfig) =>
    JSON.stringify({ ...t, auroraColors: t.auroraColors ?? null })
  return themePresets.find(p => normalize(p.theme) === normalize(theme)) ?? null
}
