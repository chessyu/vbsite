import { TextField, TextAreaField } from '../fields'
import type { FeaturedProjectBlockData } from '@/blocks/featured-project/types'

export function FeaturedProjectForm({ data, onChange }: {
  data: FeaturedProjectBlockData
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<FeaturedProjectBlockData>) => onChange(d => ({ ...d, ...p }))
  const project = data.project

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="深度案例" />
      <TextField label="项目名" value={project.title} onChange={v => patch({ project: { ...project, title: v } })} />
      <TextAreaField label="项目描述" rows={4} value={project.desc} onChange={v => patch({ project: { ...project, desc: v } })} />
      <TextField
        label="标签（逗号分隔）"
        value={project.tags.join(', ')}
        onChange={v => patch({ project: { ...project, tags: v.split(/[,，]/).map(s => s.trim()).filter(Boolean) } })}
      />
      <TextField
        label="图标（emoji）"
        value={project.icon ?? ''}
        onChange={v => patch({ project: { ...project, icon: v || undefined } })}
        placeholder="🚀"
      />
    </div>
  )
}
