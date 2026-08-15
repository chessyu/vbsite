import type { SpaceConfig } from '@/lib/spaceSchema'

/**
 * 新用户的空白起步配置。
 * 主题默认值对齐 users/cheesyu/space.json 的浅色主题基线，
 * 首页预置 hero/about/contact 最小闭环，编辑器里可自由增删。
 */
export function createBlankConfig(userId: string): SpaceConfig {
  return {
    space: {
      username: userId,
      displayName: userId,
      footer: `© ${new Date().getFullYear()} ${userId}`,
    },
    theme: {
      mode: 'light',
      background: 'linear-gradient(180deg, #fef3c7 0%, #fff7ed 50%, #fce7f3 100%)',
      textColor: 'text-stone-900',
      subTextColor: 'text-stone-600',
      mutedTextColor: 'text-stone-500',
      primaryGradient: 'from-warm-500 to-accent-pink-500',
    },
    pages: [
      {
        id: 'home',
        path: '/',
        title: userId,
        blocks: [
          {
            type: 'hero',
            data: {
              name: userId,
              title: '我的职业头衔',
              subtitle: 'HELLO',
              tagline: '一句话介绍自己。',
              cta: [{ label: '了解更多', href: '#about' }],
              useAurora: false,
            },
          },
          {
            type: 'about',
            data: {
              bio: '在这里写下你的自我介绍…',
              tags: [],
              heading: '关于我',
            },
          },
          {
            type: 'contact',
            data: {
              heading: '与我联系',
              socials: [],
              showAvailability: false,
            },
          },
        ],
      },
    ],
  }
}
