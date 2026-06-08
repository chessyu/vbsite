# VBSite — 高动效静态网页定制服务

面向 C 端/自由职业者的高动效、高定制化静态网页定制与托管平台。

## 🎯 项目定位

为个人、自由职业者、设计师提供极致动效的定制网页服务。典型场景：在线简历、作品集、亲子成长集、宠物展示页等。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 本地开发服务器
npm run dev

# 访问模板
# 简历模板：http://localhost:3000/templates/resume/
# 作品集模板：http://localhost:3000/templates/portfolio/
# 落地页：http://localhost:3000/landing/
```

## 📂 项目结构

```
vbsite/
├── templates/          # Demo 模板源文件
│   ├── resume/         # 个人简历模板
│   └── portfolio/      # 作品集模板
├── clients/            # 生成的客户页面（不入库）
├── landing/            # 官方落地页
└── scripts/            # 构建脚本
```

## 🛠 技术栈

- 纯 HTML（自包含单文件）
- Tailwind CSS v4（CDN）
- GSAP + ScrollTrigger（CDN）
- Google Fonts: Noto Sans SC + Playfair Display

## 📦 构建

```bash
# 从模板 + 客户数据生成压缩页面
node scripts/build.js --template resume --data ./client-data.json --output ./clients/cheesyu
```

## 📄 License

Private — 仅供内部使用
