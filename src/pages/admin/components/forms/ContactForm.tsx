import { TextField, SwitchField, ListEditor } from '../fields'
import type { ContactBlockData, Social } from '@/blocks/contact/types'

export function ContactForm({ data, onChange }: {
  data: ContactBlockData
  onChange: (updater: (data: Record<string, unknown>) => Record<string, unknown>) => void
}) {
  const patch = (p: Partial<ContactBlockData>) => onChange(d => ({ ...d, ...p }))
  const socials = data.socials ?? []

  return (
    <div className="space-y-3">
      <TextField label="区块标题" value={data.heading ?? ''} onChange={v => patch({ heading: v })} placeholder="与我联系" />
      <TextField label="副标题" value={data.subheading ?? ''} onChange={v => patch({ subheading: v })} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="邮箱" value={data.email ?? ''} onChange={v => patch({ email: v || undefined })} placeholder="hi@example.com" />
        <TextField label="电话" value={data.phone ?? ''} onChange={v => patch({ phone: v || undefined })} placeholder="+86 138..." />
      </div>
      <SwitchField label="显示「目前可接项目」指示" value={data.showAvailability ?? false} onChange={v => patch({ showAvailability: v })} />
      <ListEditor<Social>
        label="社交链接"
        items={socials}
        onChange={next => patch({ socials: next })}
        createItem={() => ({ icon: '💬', title: '微信', url: '', bg: 'bg-green-500' })}
        itemTitle={item => `${item.icon} ${item.title || '社交'}`}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <TextField label="图标" value={item.icon} onChange={v => update({ icon: v })} placeholder="💬" />
              <TextField label="名称" value={item.title} onChange={v => update({ title: v })} />
            </div>
            <TextField label="链接（可空，如微信填 '#'）" value={item.url ?? ''} onChange={v => update({ url: v || undefined })} />
            <TextField label="hover 背景（Tailwind 类）" value={item.bg ?? ''} onChange={v => update({ bg: v || undefined })} placeholder="bg-green-500" />
          </div>
        )}
      />
    </div>
  )
}
