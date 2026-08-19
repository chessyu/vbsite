/** LLM（OpenAI 兼容接口）封装：调用 + prompt 组装 + 输出粗校验 */

export interface LlmEnv {
  LLM_BASE_URL: string
  LLM_API_KEY: string
  LLM_MODEL: string
}

export interface AiPatch {
  /** 当前页 block 索引 */
  index: number
  type: string
  /** 整份替换后的 block data */
  data: Record<string, unknown>
}

export interface AiAnalyzeResult {
  patches: AiPatch[]
  notes: string
}

/** 输入文本上限（防 prompt 爆炸与 token 滥用） */
const MAX_TEXT_CHARS = 30_000

/**
 * 手写 block data 契约（与 src/pages/admin/state/editorReducer.ts 的 defaultBlockData 一一对应）。
 * 不直接序列化 zod schema——噪音大且模型难以从 zod 推断语义。
 */
const BLOCK_CONTRACTS = `
- hero: { name: 姓名, title: 头衔/职位, subtitle: 英文副标题或空, tagline: 一句话自我介绍, cta: [{ label, href }], useAurora: boolean }
- video-hero: { video: 保持原值不变, poster: 保持原值不变, heightVh: 数字, captions: [{ text, from, to, position: 'center'|'bottom', size: 'sm'|'lg', kicker }], fallbackHeading, fallbackSub, cta: { label, href } }
- about: { avatar: 保持原值不变, bio: 个人简介段落, tags: [标签词], heading: 区块标题 }
- experience: { heading: 区块标题, experiences: [{ period: 时间段, role: 职位, company: 公司, desc: 描述 }] }
- skills: { heading: 区块标题, skills: [{ name: 技能名, level: 0-100 熟练度数字, icon: 单个 emoji, color: Tailwind bg 类，从枚举 ['bg-amber-500','bg-sky-500','bg-emerald-500','bg-violet-500','bg-rose-500','bg-orange-500','bg-cyan-500','bg-fuchsia-500','bg-lime-500','bg-indigo-500'] 中选 }] }
- gallery: { heading: 区块标题, subheading: 副标题, projects: [{ title: 作品名, category: 分类, desc: 描述, tags: [标签], wide: boolean }] }
- featured-project: { heading: 区块标题, project: { title: 项目名, desc: 描述, tags: [标签], icon: 单个 emoji } }
- services: { heading: 区块标题, subheading: 副标题, services: [{ title: 服务名, icon: 单个 emoji, desc: 描述 }] }
- contact: { heading: 区块标题, subheading: 副标题, socials: [{ icon: 单个emoji, title: 名称（如 微信/GitHub/邮箱）, url: 链接或'#', bg: 从 ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-pink-500'] 中选 }]（资料中的联系方式/主页链接）, showAvailability: boolean }
`.trim()

const SYSTEM_PROMPT = `你是一位个人网站内容编辑。用户会上传一份资料（如简历、个人介绍），你要把资料中的关键信息合理分配到个人网站的各个区块中。

可用区块类型及其 data 字段契约：
${BLOCK_CONTRACTS}

严格要求：
1. 只使用资料中真实存在的信息，绝不编造；资料中没有的信息保留区块原值。
2. 不新增、不删除、不移动区块，只填充/更新区块的 data。
3. 每个区块输出完整替换后的 data（不是增量 patch）；不认识的字段照抄原值。
4. 资料里没有对应内容可填的区块，不要输出该区块的 patch。
5. 输出必须是单个 JSON 对象，格式：{ "patches": [{ "index": 区块索引数字, "type": 区块类型, "data": 完整data对象 }], "notes": "一段简短的中文说明，描述你如何分配的" }`

export async function analyzeWithLlm(
  env: LlmEnv,
  docText: string,
  blocks: Array<{ index: number; type: string; data: Record<string, unknown> }>,
): Promise<AiAnalyzeResult> {
  const text = docText.slice(0, MAX_TEXT_CHARS)
  const userPrompt = `【用户资料】\n${text}\n\n【当前页面区块】\n${JSON.stringify(blocks, null, 1)}\n\n【任务】将资料中的关键信息分配到各区块，按约定格式输出 JSON。`

  const res = await fetch(`${env.LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`LLM 请求失败（${res.status}）${detail.slice(0, 200)}`)
  }

  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content ?? ''
  return parseAnalyzeResult(content, blocks)
}

/** 解析并粗校验模型输出（完整 zod 校验留给前端发布链路） */
function parseAnalyzeResult(
  content: string,
  blocks: Array<{ index: number; type: string }>,
): AiAnalyzeResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('LLM 输出不是合法 JSON，请重试')
  }

  const obj = parsed as { patches?: unknown; notes?: unknown }
  if (!Array.isArray(obj.patches)) {
    throw new Error('LLM 输出缺少 patches 数组')
  }

  const patches: AiPatch[] = []
  for (const raw of obj.patches) {
    const p = raw as Partial<AiPatch>
    const block = typeof p.index === 'number' ? blocks[p.index] : undefined
    if (!block || p.type !== block.type || typeof p.data !== 'object' || p.data === null) continue
    patches.push({ index: p.index, type: p.type, data: sanitizeData(p.type, p.data as Record<string, unknown>) })
  }

  return { patches, notes: typeof obj.notes === 'string' ? obj.notes : '' }
}

/**
 * 已知字段级容错：模型偶发不守契约时把数据拉回 schema 形态，避免发布严格校验失败。
 * socials 契约历史上写过 { label, href }（正确是 { icon, title, url?, bg? }）——做别名映射 + 默认值。
 */
function sanitizeData(type: string, data: Record<string, unknown>): Record<string, unknown> {
  if (type !== 'contact' || !Array.isArray(data.socials)) return data
  const socials = data.socials
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map(s => {
      const raw = s as Record<string, unknown>
      const icon = typeof raw.icon === 'string' && raw.icon ? raw.icon : '🔗'
      const title =
        typeof raw.title === 'string' && raw.title
          ? raw.title
          : typeof raw.label === 'string' && raw.label
            ? raw.label
            : typeof raw.name === 'string' && raw.name
              ? raw.name
              : '联系方式'
      const url =
        typeof raw.url === 'string' && raw.url
          ? raw.url
          : typeof raw.href === 'string' && raw.href
            ? raw.href
            : '#'
      const bg = typeof raw.bg === 'string' && raw.bg ? raw.bg : 'bg-stone-500'
      return { icon, title, url, bg }
    })
  return { ...data, socials }
}
