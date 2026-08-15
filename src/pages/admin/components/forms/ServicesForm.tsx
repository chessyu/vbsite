import { TextField, TextAreaField, ListEditor } from '../fields'
import type { ServicesBlockData, Service } from '@/blocks/services/types'

export function ServicesForm({ data, onChange }: {
  data: ServicesBlockData
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<ServicesBlockData>) => onChange(d => ({ ...d, ...p }))

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="服务" />
      <TextField label="副标题" value={data.subheading ?? ''} onChange={v => patch({ subheading: v })} />
      <ListEditor<Service>
        label="服务卡片"
        items={data.services}
        onChange={services => patch({ services })}
        createItem={() => ({ title: '服务名', icon: '✨', desc: '描述' })}
        itemTitle={item => `${item.icon} ${item.title || '服务'}`}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_72px] gap-2">
              <TextField label="服务名" value={item.title} onChange={v => update({ title: v })} />
              <TextField label="图标" value={item.icon} onChange={v => update({ icon: v })} placeholder="✨" />
            </div>
            <TextAreaField label="描述" rows={2} value={item.desc} onChange={v => update({ desc: v })} />
          </div>
        )}
      />
    </div>
  )
}
