import { TextField, SwitchField, ListEditor } from '../fields'
import type { HeroBlockData } from '@/blocks/hero/types'

export function HeroForm({ data, onChange }: {
  data: HeroBlockData
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<HeroBlockData>) => onChange(d => ({ ...d, ...p }))
  const cta = data.cta ?? []

  return (
    <div className="space-y-3">
      <TextField label="名字（大标题）" value={data.name} onChange={v => patch({ name: v })} />
      <TextField label="头衔" value={data.title} onChange={v => patch({ title: v })} />
      <TextField label="名字上方小字（建议大写英文+宽字距）" value={data.subtitle ?? ''} onChange={v => patch({ subtitle: v })} />
      <TextField label="描述文案" value={data.tagline ?? ''} onChange={v => patch({ tagline: v })} />
      <SwitchField label="极光背景（Aurora）" value={data.useAurora ?? false} onChange={v => patch({ useAurora: v })} />
      <ListEditor
        label="CTA 按钮"
        items={cta}
        onChange={next => patch({ cta: next })}
        createItem={() => ({ label: '按钮文字', href: '#contact' })}
        itemTitle={item => item.label || '未命名按钮'}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <TextField label="文字" value={item.label} onChange={v => update({ label: v })} />
            <TextField label="链接（#锚点 或 https://…）" value={item.href} onChange={v => update({ href: v })} />
          </div>
        )}
      />
    </div>
  )
}
