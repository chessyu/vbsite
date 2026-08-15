import { TextField, TextAreaField, ImageField } from '../fields'
import type { AboutBlockData } from '@/blocks/about/types'

export function AboutForm({ data, userId, token, onChange }: {
  data: AboutBlockData
  userId: string
  token: string
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<AboutBlockData>) => onChange(d => ({ ...d, ...p }))
  const tags = data.tags ?? []

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="关于我" />
      <ImageField
        label="头像"
        hint="上传图片，或直接填 emoji"
        userId={userId}
        token={token}
        value={data.avatar ?? ''}
        onChange={v => patch({ avatar: v })}
      />
      <TextAreaField label="自我介绍" rows={5} value={data.bio} onChange={v => patch({ bio: v })} />
      <TextField
        label="标签（逗号分隔）"
        value={tags.join(', ')}
        onChange={v => patch({ tags: v.split(/[,，]/).map(s => s.trim()).filter(Boolean) })}
        placeholder="前端开发, 动效设计"
      />
    </div>
  )
}
