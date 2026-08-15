import { TextField, NumberField, ListEditor } from '../fields'
import type { SkillsBlockData, Skill } from '@/blocks/skills/types'

export function SkillsForm({ data, onChange }: {
  data: SkillsBlockData
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<SkillsBlockData>) => onChange(d => ({ ...d, ...p }))

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="专业技能" />
      <ListEditor<Skill>
        label="技能"
        items={data.skills}
        onChange={skills => patch({ skills })}
        createItem={() => ({ name: '技能名', level: 80, icon: '⭐', color: 'bg-amber-500' })}
        itemTitle={item => `${item.icon} ${item.name || '技能'}`}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <TextField label="技能名" value={item.name} onChange={v => update({ name: v })} />
            <NumberField label="熟练度（0-100）" value={item.level} onChange={v => update({ level: v })} min={0} max={100} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="图标（emoji）" value={item.icon} onChange={v => update({ icon: v })} />
              <TextField label="背景色（Tailwind 类）" value={item.color} onChange={v => update({ color: v })} placeholder="bg-amber-500" />
            </div>
          </div>
        )}
      />
    </div>
  )
}
