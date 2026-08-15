# src/pages/admin/ — 管理后台页面

`/admin` 路由的页面组件：客户网站管理（列表/编辑链接/新建）与可视化编辑器（左编辑右预览）。

## 文件

| 文件 | 路由 | 职责 |
|---|---|---|
| `AdminApp.tsx` | `/admin` 壳 | Suspense 兜底 + Outlet（鉴权由各页自处理） |
| `AdminLoginPage.tsx` | `/admin/login` | ADMIN_PASSWORD 登录 |
| `AdminDashboardPage.tsx` | `/admin`（index） | 客户列表 + 生成编辑链接 + 新建入口 |
| `AdminEditPage.tsx` | `/admin/:userId/edit` | **主编辑器**：token UX 校验（无效/过期→404）+ 左编辑右预览工作台 |
| `AdminNewUserPage.tsx` | `/admin/newUser` | 输 userId → 生成编辑链接 → 跳编辑器 |
| `PreviewPage.tsx` | `/admin/preview` | **iframe 内侧**：postMessage 收 config，复刻 SingleUserSpacePage 渲染链路 |

## 编辑器架构

- **状态**：`state/editorReducer.ts`（useReducer）+ `state/EditorContext.tsx`（Provider）。草稿持久化 localStorage（key 含 userId）。全部 lazy 加载，不进首屏 bundle。
- **预览必须 iframe**：block 的 ScrollTrigger 绑 window 滚动，iframe 独立 window 保证动效正确，同时隔离 theme 全局类名冲突。数据通道 postMessage（同源 + origin 校验，150ms debounce）。
- **表单**：`components/forms/` 每个 block 一个手写表单，`formRegistry` 注册（仿 `blocks/registry.ts` 的 defineBlock 受控类型擦除）。原子控件在 `components/fields/`（TextField/ListEditor/ImageField 等）。
- **鉴权原则**：前端只做 UX 层（解析 token exp 做倒计时），数据保护全在 Functions；401/403/404 一律渲染 `NotFound`。

## 约定

- 编辑器配色统一 stone 色系，与站点本身的视觉体系解耦。
- 发布流程状态机：`idle → validating → committing → done/error`（见 editorReducer）。
