import { TextField, TextAreaField, SwitchField, ImageField, ListEditor } from '../fields'
import type { GalleryBlockData, Project } from '@/blocks/gallery/types'

export function GalleryForm({ data, userId, token, onChange }: {
  data: GalleryBlockData
  userId: string
  token: string
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<GalleryBlockData>) => onChange(d => ({ ...d, ...p }))

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="精选作品" />
      <TextField label="副标题" value={data.subheading ?? ''} onChange={v => patch({ subheading: v })} />
      <ListEditor<Project>
        label="作品"
        items={data.projects}
        onChange={projects => patch({ projects })}
        createItem={() => ({ title: '作品名', category: '分类', desc: '描述', tags: [] })}
        itemTitle={item => item.title || '未命名作品'}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <TextField label="作品名" value={item.title} onChange={v => update({ title: v })} />
              <TextField label="分类" value={item.category} onChange={v => update({ category: v })} />
            </div>
            <TextAreaField label="描述（hover 展示）" rows={2} value={item.desc} onChange={v => update({ desc: v })} />
            <ImageField
              label="作品图"
              hint="无图时降级为渐变卡面 + emoji"
              userId={userId}
              token={token}
              value={item.image ?? ''}
              onChange={v => update({ image: v || undefined })}
            />
            <TextField
              label="emoji 图标（无图降级用）"
              value={item.icon ?? ''}
              onChange={v => update({ icon: v || undefined })}
              placeholder="🎨"
            />
            <TextField
              label="标签（逗号分隔）"
              value={(item.tags ?? []).join(', ')}
              onChange={v => update({ tags: v.split(/[,，]/).map(s => s.trim()).filter(Boolean) })}
            />
            <SwitchField label="大卡（跨两格）" value={item.wide ?? false} onChange={v => update({ wide: v })} />
          </div>
        )}
      />
    </div>
  )
}
