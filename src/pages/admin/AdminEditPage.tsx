import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import NotFound from '@/components/shared/NotFound'
import { spaceApi, ApiError } from '@/lib/admin/api'
import { parseEditToken, isEditTokenExpired, formatRemaining } from '@/lib/admin/editToken'
import { parseSpaceConfig } from '@/lib/spaceSchema'
import type { SpaceConfig } from '@/lib/spaceSchema'
import { createBlankConfig } from './blankConfig'
import { EditorProvider } from './state/EditorContext'
import { useEditor, clearDraft } from './state/useEditor'
import { SpaceMetaForm } from './components/SpaceMetaForm'
import { ThemeForm } from './components/ThemeForm'
import { PageStructureForm } from './components/PageStructureForm'
import { AIImportPanel } from './components/AIImportPanel'
import { PreviewFrame } from './components/PreviewFrame'

/**
 * /admin/:userId/edit — 左编辑右预览主页面。
 * 鉴权（UX 层）：本地解析 token 过期 → 直接 404；API 401/403/404 → 也渲染 404。
 * 真正的数据保护在 Functions 端。
 *
 * mode="new" 时由 AdminNewUserPage 复用（初始配置为空模板，不走 API 加载）。
 */
export default function AdminEditPage() {
  const { userId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const payload = useMemo(() => parseEditToken(token), [token])
  // 本地 UX 校验：无 token / 已过期 → 直接 404（不发请求）。
  // 读取失败/未授权也归入 404（不区分原因，防探测）。
  const tokenInvalid = !token || isEditTokenExpired(payload)
  const [config, setConfig] = useState<SpaceConfig | null>(null)
  const [state404, setState404] = useState(tokenInvalid)
  const [loading, setLoading] = useState(!tokenInvalid)

  useEffect(() => {
    let cancelled = false
    if (tokenInvalid) return
    spaceApi
      .get(userId, token)
      .then(({ config: raw }) => {
        if (cancelled) return
        const parsed = parseSpaceConfig(raw)
        if (!parsed.ok) {
          setState404(true)
          return
        }
        setConfig(parsed.config)
      })
      .catch(err => {
        if (cancelled) return
        // 404 = 该用户尚无 space.json（新建场景）→ 空白模板起步；
        // 401/403 = 凭证无效 → 404 页面（防探测）
        if (err instanceof ApiError && err.status === 404) {
          setConfig(createBlankConfig(userId))
        } else {
          setState404(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, token, payload, tokenInvalid])

  if (state404) return <NotFound />
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-stone-400">加载中…</div>
  }
  if (!config) return <NotFound />

  return (
    <EditorProvider userId={userId} initialConfig={config}>
      <EditWorkbench userId={userId} token={token ?? ''} remaining={formatRemaining(payload)} />
    </EditorProvider>
  )
}

/** 编辑工作台布局：顶栏 + 左编辑 / 右预览 */
function EditWorkbench({ userId, token, remaining }: {
  userId: string
  token: string
  remaining: string
}) {
  const { state, dispatch, dirty } = useEditor()
  const [tab, setTab] = useState<'space' | 'theme' | 'structure'>('structure')
  const [pageId, setPageId] = useState(state?.draft.pages[0]?.id ?? 'home')
  const [blockIdx, setBlockIdx] = useState(-1)

  if (!state) return null

  async function handlePublish() {
    dispatch({ type: 'PUBLISH_START' })
    try {
      const { commitSha, htmlUrl } = await spaceApi.publish(userId, state!.draft, token)
      dispatch({ type: 'PUBLISH_SUCCESS', commitUrl: htmlUrl })
      console.info(`已提交 ${commitSha}，约 2 分钟后生效`)
    } catch (err) {
      dispatch({ type: 'PUBLISH_FAIL', error: err instanceof Error ? err.message : '发布失败' })
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 顶栏 */}
      <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stone-800">编辑：{state.draft.space.displayName || userId}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{remaining}</span>
          {dirty && <span className="text-[11px] text-stone-400">● 有未发布修改</span>}
        </div>
        <div className="flex items-center gap-2">
          {state.publishStatus === 'done' && state.lastCommitUrl && (
            <a
              href={state.lastCommitUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-600 hover:underline"
            >
              已提交 ✓（约 2 分钟后生效）↗
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              if (dirty && !confirm('丢弃未发布的修改，重置为线上版本？')) return
              clearDraft(userId)
              dispatch({ type: 'RESET_TO_SAVED' })
              setBlockIdx(-1)
            }}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
          >
            重置
          </button>
          <button
            type="button"
            disabled={!dirty || state.publishStatus === 'validating' || state.publishStatus === 'committing'}
            onClick={handlePublish}
            className="rounded-lg bg-stone-800 px-4 py-1.5 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {state.publishStatus === 'validating' || state.publishStatus === 'committing' ? '发布中…' : '发布'}
          </button>
        </div>
      </header>

      {state.publishStatus === 'error' && state.publishError && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-xs whitespace-pre-wrap text-red-700">
          {state.publishError}
        </div>
      )}

      {/* 主体：左编辑 / 右预览 */}
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-stone-200 bg-stone-50">
          {/* tab 切换 */}
          <div className="flex shrink-0 border-b border-stone-200 bg-white px-2">
            {([
              ['structure', '内容结构'],
              ['theme', '主题'],
              ['space', '空间信息'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3 py-2 text-xs transition-colors ${
                  tab === key
                    ? 'border-b-2 border-stone-800 font-medium text-stone-800'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 页面切换（结构 tab 内） */}
          {tab === 'structure' && (
            <div className="shrink-0 border-b border-stone-100 bg-white px-3 py-1.5">
              <select
                value={pageId}
                onChange={e => {
                  setPageId(e.target.value)
                  setBlockIdx(-1)
                }}
                className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600"
              >
                {state.draft.pages.map(page => (
                  <option key={page.id} value={page.id}>{page.title || page.id}</option>
                ))}
              </select>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab === 'space' && <SpaceMetaForm />}
            {tab === 'theme' && <ThemeForm />}
            {tab === 'structure' && (
              <>
                <AIImportPanel pageId={pageId} />
                <PageStructureForm pageId={pageId} blockIdx={blockIdx} onSelect={setBlockIdx} />
              </>
            )}
          </div>
        </aside>

        {/* 右侧预览 */}
        <main className="min-w-0 flex-1">
          <PreviewFrame
            config={state.draft}
            pageId={pageId}
            blockIdx={blockIdx}
            onPageChange={id => {
              setPageId(id)
              setBlockIdx(-1)
            }}
          />
        </main>
      </div>
    </div>
  )
}
