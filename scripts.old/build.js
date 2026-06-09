#!/usr/bin/env node

/**
 * VBSite 构建脚本
 * 将模板 HTML + 客户 JSON 数据 → 压缩后的单文件 HTML
 *
 * 用法:
 *   node scripts/build.js --template resume --data ./client-data.json --output ./clients/cheesyu
 *   node scripts/build.js --template portfolio --data ./client-data.json
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] || true;
      i++;
    }
  }
  return result;
}

// 简单的 HTML 压缩（不依赖外部包）
function minifyHTML(html) {
  return html
    // 移除 HTML 注释（保留条件注释）
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // 压缩多个空格为一个
    .replace(/\s{2,}/g, ' ')
    // 移除标签间的空白
    .replace(/>\s+</g, '><')
    // 移除行首空白
    .replace(/^\s+/gm, '')
    // 移除空行
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// 替换占位符
function replacePlaceholders(html, data) {
  // 替换简单字段 {{NAME}}, {{TITLE}} 等
  const simpleFields = ['NAME', 'TITLE', 'TAGLINE', 'BIO', 'PHOTO'];
  simpleFields.forEach(field => {
    if (data[field.toLowerCase()] !== undefined) {
      html = html.replace(new RegExp(`\\{\\{${field}\\}\\}`, 'g'), data[field.toLowerCase()]);
    }
  });

  // 替换嵌套占位符 {{contact.email}} 等
  const nestedRegex = /\{\{(\w+)\.(\w+)\}\}/g;
  html = html.replace(nestedRegex, (match, obj, key) => {
    if (data[obj] && data[obj][key] !== undefined) {
      return data[obj][key];
    }
    return match;
  });

  return html;
}

// 主流程
async function main() {
  const args = parseArgs();

  if (!args.template) {
    console.error('❌ 请指定模板名称: --template <resume|portfolio>');
    process.exit(1);
  }

  if (!args.data) {
    console.error('❌ 请指定客户数据文件: --data <path>');
    process.exit(1);
  }

  const templateName = args.template;
  const dataPath = path.resolve(args.data);
  const outputPath = args.output
    ? path.resolve(args.output)
    : path.resolve(__dirname, '..', 'clients', path.basename(dataPath, '.json'));

  // 读取模板
  const templatePath = path.resolve(__dirname, '..', templateName, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 模板不存在: ${templatePath}`);
    process.exit(1);
  }
  const templateHTML = fs.readFileSync(templatePath, 'utf-8');

  // 读取客户数据
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ 数据文件不存在: ${dataPath}`);
    process.exit(1);
  }
  const clientData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`\n🚀 VBSite Builder`);
  console.log(`   模板: ${templateName}`);
  console.log(`   数据: ${path.basename(dataPath)}`);
  console.log(`   输出: ${outputPath}\n`);

  // Step 1: 替换占位符
  let html = replacePlaceholders(templateHTML, clientData);
  console.log('✅ 占位符替换完成');

  // Step 2: 压缩 HTML
  html = minifyHTML(html);
  console.log('✅ HTML 压缩完成');

  // Step 3: 写入输出
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  const outputFile = path.join(outputPath, 'index.html');
  fs.writeFileSync(outputFile, html, 'utf-8');

  const fileSize = Buffer.byteLength(html, 'utf-8');
  const fileSizeKB = (fileSize / 1024).toFixed(1);

  console.log(`✅ 输出文件: ${outputFile}`);
  console.log(`📦 文件大小: ${fileSizeKB} KB\n`);

  if (fileSize > 200 * 1024) {
    console.warn('⚠️  文件超过 200KB，建议优化图片资源');
  }

  console.log('🎉 构建完成！\n');
}

main().catch(err => {
  console.error('❌ 构建失败:', err.message);
  process.exit(1);
});
