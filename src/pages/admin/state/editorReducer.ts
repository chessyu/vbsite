import type { SpaceConfig, BlockDeclaration, BlockType } from '@/lib/spaceSchema'

/**
 * 编辑器状态机 — useReducer（不引状态库）。
 * 所有变更走 action，草稿（draft）与已保存基线（saved）分离，dirty = 两者不等。
 */

export interface EditorState {
  userId: string
  /** 当前编辑草稿 */
  draft: SpaceConfig
  /** 最近一次发布/加载的基线（用于 dirty 判断与「重置」） */
  saved: SpaceConfig
  /** 发布流程状态 */
  publishStatus: 'idle' | 'validating' | 'committing' | 'done' | 'error'
  publishError: string | null
  lastCommitUrl: string | null
}

export type EditorAction =
  | { type: 'INIT'; userId: string; config: SpaceConfig }
  | { type: 'SET_SPACE_META'; patch: Partial<SpaceConfig['space']> }
  | { type: 'SET_THEME'; patch: Partial<SpaceConfig['theme']> }
  | { type: 'SET_PAGE_META'; pageIdx: number; patch: Partial<SpaceConfig['pages'][number]> }
  | { type: 'MOVE_BLOCK'; pageIdx: number; blockIdx: number; dir: -1 | 1 }
  | { type: 'ADD_BLOCK'; pageIdx: number; blockType: BlockType }
  | { type: 'REMOVE_BLOCK'; pageIdx: number; blockIdx: number }
  | { type: 'UPDATE_BLOCK_DATA'; pageIdx: number; blockIdx: number; updater: (data: Record<string, unknown>) => Record<string, unknown> }
  | { type: 'PUBLISH_START' }
  | { type: 'PUBLISH_SUCCESS'; commitUrl: string }
  | { type: 'PUBLISH_FAIL'; error: string }
  | { type: 'RESET_TO_SAVED' }

function clone(config: SpaceConfig): SpaceConfig {
  return JSON.parse(JSON.stringify(config)) as SpaceConfig
}

export function editorReducer(state: EditorState | null, action: EditorAction): EditorState | null {
  if (action.type === 'INIT') {
    const config = clone(action.config)
    return {
      userId: action.userId,
      draft: config,
      saved: clone(config),
      publishStatus: 'idle',
      publishError: null,
      lastCommitUrl: null,
    }
  }
  if (!state) return state

  switch (action.type) {
    case 'SET_SPACE_META':
      return { ...state, draft: { ...state.draft, space: { ...state.draft.space, ...action.patch } } }

    case 'SET_THEME':
      return { ...state, draft: { ...state.draft, theme: { ...state.draft.theme, ...action.patch } } }

    case 'SET_PAGE_META': {
      const pages = state.draft.pages.map((page, i) =>
        i === action.pageIdx ? { ...page, ...action.patch } : page,
      )
      return { ...state, draft: { ...state.draft, pages } }
    }

    case 'MOVE_BLOCK': {
      const pages = state.draft.pages.map((page, i) => {
        if (i !== action.pageIdx) return page
        const blocks = [...page.blocks]
        const target = action.blockIdx + action.dir
        if (target < 0 || target >= blocks.length) return page
        ;[blocks[action.blockIdx], blocks[target]] = [blocks[target], blocks[action.blockIdx]]
        return { ...page, blocks }
      })
      return { ...state, draft: { ...state.draft, pages } }
    }

    case 'ADD_BLOCK': {
      const block: BlockDeclaration = { type: action.blockType, data: defaultBlockData(action.blockType) }
      const pages = state.draft.pages.map((page, i) =>
        i === action.pageIdx ? { ...page, blocks: [...page.blocks, block] } : page,
      )
      return { ...state, draft: { ...state.draft, pages } }
    }

    case 'REMOVE_BLOCK': {
      const pages = state.draft.pages.map((page, i) =>
        i === action.pageIdx ? { ...page, blocks: page.blocks.filter((_, bi) => bi !== action.blockIdx) } : page,
      )
      return { ...state, draft: { ...state.draft, pages } }
    }

    case 'UPDATE_BLOCK_DATA': {
      const pages = state.draft.pages.map((page, i) => {
        if (i !== action.pageIdx) return page
        const blocks = page.blocks.map((block, bi) =>
          bi === action.blockIdx
            ? { ...block, data: action.updater(block.data as Record<string, unknown>) }
            : block,
        )
        return { ...page, blocks }
      })
      return { ...state, draft: { ...state.draft, pages } }
    }

    case 'PUBLISH_START':
      return { ...state, publishStatus: 'validating', publishError: null }

    case 'PUBLISH_SUCCESS':
      return {
        ...state,
        publishStatus: 'done',
        lastCommitUrl: action.commitUrl,
        saved: clone(state.draft),
      }

    case 'PUBLISH_FAIL':
      return { ...state, publishStatus: 'error', publishError: action.error }

    case 'RESET_TO_SAVED':
      return {
        ...state,
        draft: clone(state.saved),
        publishStatus: 'idle',
        publishError: null,
      }

    default:
      return state
  }
}

/** 新增 block 时的最小可用 data（满足各 schema 必填字段） */
function defaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { name: '姓名', title: '头衔', subtitle: '', tagline: '', cta: [], useAurora: false }
    case 'about':
      return { avatar: '', bio: '个人简介…', tags: [], heading: '关于我' }
    case 'experience':
      return { heading: '工作经历', experiences: [{ period: '2024 - 至今', role: '职位', company: '公司', desc: '描述' }] }
    case 'skills':
      return { heading: '专业技能', skills: [{ name: '技能', level: 80, icon: '⭐', color: 'bg-amber-500' }] }
    case 'gallery':
      return { heading: '精选作品', subheading: '', projects: [{ title: '作品名', category: '分类', desc: '描述', tags: [], wide: false }] }
    case 'featured-project':
      return { heading: '深度案例', project: { title: '项目名', desc: '描述', tags: [], icon: '🚀' } }
    case 'services':
      return { heading: '服务', subheading: '', services: [{ title: '服务名', icon: '✨', desc: '描述' }] }
    case 'contact':
      return { heading: '与我联系', subheading: '', socials: [], showAvailability: false }
    default:
      return {}
  }
}
