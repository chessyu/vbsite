/**
 * space.json 构建期严格校验（generate.cjs 在 vite build 前调用）。
 *
 * 用法: npx tsx scripts/validate-config.mts --user cheesyu
 *       npx tsx scripts/validate-config.mts --all
 *
 * 退出码：0 = 通过；1 = 校验失败。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 复用 src 下的严格校验（zod schema 单一来源）
import { parseSpaceConfigStrict } from '../src/lib/spaceSchema.ts'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const usersDir = path.join(projectRoot, 'users')

function parseArgs() {
  const args = process.argv.slice(2)
  const result: { user: string | null; all: boolean } = { user: null, all: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--user' && args[i + 1]) result.user = args[++i]
    if (args[i] === '--all') result.all = true
  }
  return result
}

/** 校验单个用户，返回错误列表（空 = 通过） */
function validateUser(username: string): string[] {
  const spaceJsonPath = path.join(usersDir, username, 'space.json')
  if (!fs.existsSync(spaceJsonPath)) {
    return [`配置文件不存在: ${spaceJsonPath}`]
  }
  try {
    const raw = JSON.parse(fs.readFileSync(spaceJsonPath, 'utf-8'))
    const result = parseSpaceConfigStrict(raw)
    if (!result.ok) return result.issues
    return []
  } catch (err) {
    return [`JSON 解析失败: ${(err as Error).message}`]
  }
}

function main() {
  const { user, all } = parseArgs()

  let usernames: string[]
  if (all) {
    usernames = fs
      .readdirSync(usersDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .filter(d => fs.existsSync(path.join(usersDir, d.name, 'space.json')))
      .map(d => d.name)
    if (usernames.length === 0) {
      console.error('❌ users/ 下没有找到任何 space.json')
      process.exit(1)
    }
  } else if (user) {
    usernames = [user]
  } else {
    console.error('❌ 请指定用户: --user <username> 或 --all')
    process.exit(1)
  }

  let failed = false
  for (const name of usernames) {
    const issues = validateUser(name)
    if (issues.length) {
      failed = true
      console.error(`\n❌ [${name}] 配置校验失败:`)
      for (const issue of issues) console.error(`   - ${issue}`)
    } else {
      console.log(`✅ [${name}] 配置校验通过`)
    }
  }

  if (failed) process.exit(1)
}

main()
