import { TextField, NumberField, ListEditor, VideoField, ImageField } from '../fields'
import type { VideoHeroBlockData, Caption } from '@/blocks/video-hero/types'

/** 结尾 settle 空间（滚动进度的 10%，给静置 CTA 呼吸） */
const TAIL = 0.1
/** 单条字幕的可读平台下限（vh），低于此值黄色警告 */
const READABLE_VH = 80

/** 新字幕的区间自动分配：接续上一条 to，均分剩余空间 */
function nextRange(captions: Caption[]): { from: number; to: number } {
  const last = captions.at(-1)
  const from = Math.min(last ? last.to : 0.05, 1 - TAIL - 0.1)
  const readableEnd = 1 - TAIL
  const remaining = Math.max(readableEnd - from, 0.1)
  const to = Math.min(from + Math.min(remaining / 2, 0.3), readableEnd)
  return { from: Number(from.toFixed(3)), to: Number(to.toFixed(3)) }
}

function paceLabel(cap: Caption, heightVh: number): string {
  return `${((cap.to - cap.from) * heightVh).toFixed(0)}vh`
}

export function VideoHeroForm({ data, userId, token, onChange }: {
  data: VideoHeroBlockData
  userId: string
  token: string
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<VideoHeroBlockData>) => onChange(d => ({ ...d, ...p }))
  const captions = data.captions ?? []
  const heightVh = data.heightVh

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
        电影感滚动视频首屏：桌面端滚动驱动视频正放/倒放 + 字幕带浮现；手机/平板竖屏/减弱动效
        自动降级为静态海报（属预期行为）。编辑器右侧预览切「📱 移动」看到的就是降级形态。
      </div>

      <VideoField
        label="滚动视频"
        hint="上传后浏览器内自动转码（短关键帧 + 压缩）并提取海报帧，请耐心等待"
        userId={userId}
        token={token}
        value={data.video.url}
        posterValue={data.poster}
        onChange={({ url, bytes, posterUrl, previewUrl, posterPreviewUrl }) =>
          onChange(d => ({
            ...d,
            // previewUrl = 会话内 blob 预览（发布时由 publish 端点剥离）
            video: { url, bytes: bytes || undefined, previewUrl: previewUrl || undefined },
            ...(posterUrl ? { poster: posterUrl } : {}),
            ...(posterPreviewUrl ? { posterPreviewUrl } : {}),
          }))
        }
      />

      <ImageField
        label="海报图"
        hint="静态降级形态与视频加载中的底图（上传视频后自动提取，可手动替换）"
        userId={userId}
        token={token}
        value={data.poster}
        onChange={v => patch({ poster: v })}
      />

      <NumberField
        label={`滚动轨道高度（${heightVh}vh）`}
        hint="400vh ≈ 4 屏滚动；更长 = 节奏更从容"
        value={heightVh}
        min={200}
        max={800}
        step={50}
        onChange={v => patch({ heightVh: v })}
      />

      <ListEditor<Caption>
        label="字幕带"
        items={captions}
        onChange={next => patch({ captions: next })}
        createItem={() => ({
          text: '新的字幕文案',
          ...nextRange(captions),
          position: 'center',
          size: 'lg',
        })}
        itemSummary={(item, i) => `${i + 1}. ${item.text.slice(0, 20) || '未命名'}`}
        renderSummaryExtra={item => {
          const paceVh = (item.to - item.from) * heightVh
          return (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                paceVh < READABLE_VH ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-500'
              }`}
              title={paceVh < READABLE_VH ? '短于可读平台（建议 ≥80vh），快速滚动时可能一闪而过' : '滚动距离'}
            >
              {paceLabel(item, heightVh)}
              {paceVh < READABLE_VH ? ' ⚠' : ''}
            </span>
          )
        }}
        renderItem={(item, update) => {
          const paceVh = (item.to - item.from) * heightVh
          return (
            <div className="space-y-3">
              {/* 内容组 */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">内容</p>
                <TextField label="文案" value={item.text} onChange={v => update({ text: v })} />
                <TextField label="胶囊小字（可空）" value={item.kicker ?? ''} onChange={v => update({ kicker: v || undefined })} />
              </div>
              {/* 出现时机组 */}
              <div className="space-y-2 border-t border-stone-200 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">出现时机</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="区间起点" value={item.from} min={0} max={0.95} step={0.01} onChange={v => update({ from: Math.min(v, item.to - 0.02) })} />
                  <NumberField label="区间终点" value={item.to} min={0.05} max={1} step={0.01} onChange={v => update({ to: Math.max(v, item.from + 0.02) })} />
                </div>
                <div className={`text-[11px] ${paceVh < READABLE_VH ? 'text-amber-600' : 'text-stone-400'}`}>
                  占 {paceLabel(item, heightVh)} 滚动距离
                  {paceVh < READABLE_VH && ' ⚠️ 短于可读平台（建议 ≥80vh）'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-stone-600">屏幕位置</span>
                    <select
                      value={item.position}
                      onChange={e => update({ position: e.target.value as Caption['position'] })}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800"
                    >
                      <option value="center">居中</option>
                      <option value="left">左侧</option>
                      <option value="right">右侧</option>
                      <option value="bottom">底部</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-stone-600">字号</span>
                    <select
                      value={item.size}
                      onChange={e => update({ size: e.target.value as Caption['size'] })}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800"
                    >
                      <option value="lg">大（主叙事）</option>
                      <option value="md">中</option>
                      <option value="sm">小（注解）</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )
        }}
      />

      <div className="border-t border-stone-200 pt-3">
        <p className="mb-2 text-xs font-semibold text-stone-700">降级形态文案（手机/平板/减弱动效时展示）</p>
        <div className="space-y-3">
          <TextField label="标题（电影模式下作为页面 h1 语义）" value={data.fallbackHeading} onChange={v => patch({ fallbackHeading: v })} />
          <TextField label="副文案" value={data.fallbackSub} onChange={v => patch({ fallbackSub: v })} />
          <TextField
            label="CTA 按钮文字（可空）"
            value={data.cta?.label ?? ''}
            onChange={v => patch({ cta: v ? { label: v, href: data.cta?.href ?? '#next' } : undefined })}
          />
          {data.cta && (
            <TextField label="CTA 链接" value={data.cta.href} onChange={v => patch({ cta: { label: data.cta!.label, href: v } })} />
          )}
        </div>
      </div>
    </div>
  )
}
