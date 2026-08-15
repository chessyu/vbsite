import { TextField, TextAreaField, ListEditor } from '../fields'
import type { ExperienceBlockData, Experience } from '@/blocks/experience/types'

export function ExperienceForm({ data, onChange }: {
  data: ExperienceBlockData
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<ExperienceBlockData>) => onChange(d => ({ ...d, ...p }))

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="工作经历" />
      <ListEditor<Experience>
        label="经历条目"
        items={data.experiences}
        onChange={experiences => patch({ experiences })}
        createItem={() => ({ period: '2024 - 至今', role: '职位', company: '公司', desc: '描述' })}
        itemTitle={item => `${item.role || '职位'} · ${item.company || '公司'}`}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <TextField label="时间段" value={item.period} onChange={v => update({ period: v })} placeholder="2020 - 2024" />
            <TextField label="职位" value={item.role} onChange={v => update({ role: v })} />
            <TextField label="公司" value={item.company} onChange={v => update({ company: v })} />
            <TextAreaField label="描述" rows={2} value={item.desc} onChange={v => update({ desc: v })} />
          </div>
        )}
      />
    </div>
  )
}
