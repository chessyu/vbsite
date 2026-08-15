#!/usr/bin/env node

/**
 * VBSite Generate CLI
 * 从用户空间的 space.json 生成独立的静态页面包
 *
 * 用法:
 *   npm run generate -- --user cheesyu
 *   npm run generate -- --all
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const usersDir = path.join(projectRoot, 'users')
const clientsDir = path.join(projectRoot, 'clients')

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const result = { user: null, output: null, all: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--user' && args[i + 1]) { result.user = args[++i]; continue }
    if (args[i] === '--output' && args[i + 1]) { result.output = args[++i]; continue }
    if (args[i] === '--all') { result.all = true; continue }
  }
  return result
}

// 单个用户构建
function buildUser(username, outputDir) {
  const spaceJsonPath = path.join(usersDir, username, 'space.json')

  if (!fs.existsSync(spaceJsonPath)) {
    console.error(`❌ 用户空间配置不存在: ${spaceJsonPath}`)
    process.exit(1)
  }

  const spaceConfig = JSON.parse(fs.readFileSync(spaceJsonPath, 'utf-8'))

  // 构建前严格校验（未知 block type / 字段类型错误在此拦截）
  try {
    execSync(`npx tsx scripts/validate-config.mts --user ${username}`, {
      cwd: projectRoot,
      stdio: 'inherit',
    })
  } catch {
    console.error(`❌ 配置校验失败，已中止构建: ${spaceJsonPath}`)
    process.exit(1)
  }

  // 校验 username 一致性
  if (spaceConfig.space?.username && spaceConfig.space.username !== username) {
    console.warn(`⚠️  space.json 中 username="${spaceConfig.space.username}"，但命令行指定 --user ${username}，以命令行为准`)
  }

  // 确定输出目录
  const outDir = outputDir
    ? path.resolve(outputDir)
    : path.join(clientsDir, username)

  console.log(`\n🔧 生成用户空间`)
  console.log(`   用户: ${username}`)
  console.log(`   页面数: ${spaceConfig.pages?.length || 0}`)
  console.log(`   数据: ${spaceJsonPath}`)
  console.log(`   输出: ${outDir}\n`)

  // 设置环境变量并执行 vite build
  const env = {
    ...process.env,
    VITE_BUILD_USER: username,
    VITE_SPACE_CONFIG: JSON.stringify(spaceConfig),
  }

  try {
    execSync('npx vite build', {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
    })

    // vite 默认输出到 dist/，移动到用户目录
    const distDir = path.join(projectRoot, 'dist')
    if (fs.existsSync(distDir)) {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

      const files = fs.readdirSync(distDir)
      for (const file of files) {
        const src = path.join(distDir, file)
        const dst = path.join(outDir, file)
        if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true })
        fs.renameSync(src, dst)
      }
      try { fs.rmdirSync(distDir) } catch {}
    }

    // 报告结果
    const indexFile = path.join(outDir, 'index.html')
    if (fs.existsSync(indexFile)) {
      const size = Buffer.byteLength(fs.readFileSync(indexFile), 'utf-8')
      console.log(`\n✅ 生成成功！`)
      console.log(`   输出目录: ${outDir}`)
      console.log(`   文件数量: ${countFiles(outDir)}`)
      console.log(`   index.html: ${(size / 1024).toFixed(1)} KB\n`)
    }
  } catch (err) {
    console.error(`❌ 构建失败: ${err.message}`)
    process.exit(1)
  }
}

// 统计目录文件数
function countFiles(dir) {
  let count = 0
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    if (item.isDirectory()) {
      count += countFiles(path.join(dir, item.name))
    } else {
      count++
    }
  }
  return count
}

// 主流程
function main() {
  const args = parseArgs()

  if (args.all) {
    // 批量模式：扫描 users/ 下所有 space.json
    if (!fs.existsSync(usersDir)) {
      console.error('❌ users/ 目录不存在')
      process.exit(1)
    }

    const usernames = fs.readdirSync(usersDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .filter(d => fs.existsSync(path.join(usersDir, d.name, 'space.json')))
      .map(d => d.name)

    if (usernames.length === 0) {
      console.error('❌ users/ 下没有找到任何 space.json')
      process.exit(1)
    }

    console.log(`\n🚀 批量生成 ${usernames.length} 个用户空间\n`)

    for (const name of usernames) {
      buildUser(name, path.join(clientsDir, name))
    }

    console.log(`🎉 批量生成完成！共 ${usernames.length} 个用户\n`)
    return
  }

  // 单用户模式
  if (!args.user) {
    console.error('❌ 请指定用户: --user <username>')
    console.error('   或使用 --all 批量生成')
    process.exit(1)
  }

  buildUser(args.user, args.output)
}

main()
