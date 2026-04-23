# AGENTS.md — exam-admin

## Commands
- `pnpm install` — Install dependencies (必须用pnpm，monorepo)
- `pnpm dev` — Dev server
- `pnpm build` — Production build
- `pnpm lint` — ESLint check
- `pnpm typecheck` — TypeScript type check
- `pnpm commit` — Generate conventional commit message

## Git Remotes
- origin: https://gitee.com/hanbinsite/exam-admin.git (主要)
- github: git@github.com:hanbinsite/exam-admin.git (部署时才push)

## Base Template
SoybeanAdmin ElementPlus 版本 (https://github.com/soybeanjs/soybean-admin-element-plus)
- 已包含：登录页、权限路由、JWT认证、侧边栏、状态管理、国际化、主题配置
- 我们在此基础上定制：替换mock数据为真实exam-server API调用，添加题库管理等业务页面

## Structure (基于SoybeanAdmin定制)
```
exam-admin/
├── packages/                # pnpm monorepo
│   ├── locales/             # 国际化语言包
│   ├── utils/               # 工具函数
│   ├── colors/              # 颜色配置
│   ├── constants/           # 常量定义
│   ├── themes/              # 主题配置
│   └── icons/               # 图标资源
├── src/
│   ├── main.ts              # 入口
│   ├── App.vue              # 根组件
│   ├── api/                 # API调用层（替换mock为真实API）
│   │   ├── client.ts        # Axios实例 + JWT拦截器
│   │   ├── exam-server/     # exam-server API模块
│   │   │   ├── auth.ts      # 管理员认证
│   │   │   ├── dashboard.ts # 仪表盘
│   │   │   ├── subjects.ts  # 科目管理
│   │   │   ├── question-types.ts  # 题型管理
│   │   │   ├── questions.ts # 题目管理
│   │   │   ├── materials.ts # 学习资料
│   │   │   ├── exams.ts     # 考试配置
│   │   │   ├── scores.ts    # 成绩统计
│   │   │   ├── users.ts     # 用户管理
│   │   │   └── rbac.ts      # RBAC权限管理
│   ├── constants/           # 业务常量
│   │   ├── permissions.ts   # 权限code常量
│   │   └── question-types.ts # 题型预设
│   ├── dao/                 # 数据访问（SoybeanAdmin内置）
│   ├── layouts/             # 布局组件（内置，可直接使用）
│   ├── plugins/             # 插件配置
│   ├── router/              # 路由（Elegant Router自动生成）
│   │   ├── routes/          # 路由模块
│   │   │   ├── exam-server/ # 业务路由模块
│   ├── store/               # Pinia状态管理（内置auth store）
│   │   ├── modules/
│   │   │   ├── auth.ts      # 认证状态（改造：调 /admin/auth/login）
│   │   │   ├── exam.ts      # 考试相关状态（科目选择等）
│   ├── theme/               # 主题设置（内置）
│   ├── typings/             # 类型定义
│   │   ├── api.d.ts         # API类型
│   │   ├── business.d.ts    # 业务类型
│   ├── utils/               # 工具函数
│   ├── views/               # 页面视图
│   │   ├── _builtin/        # 内置页面（登录、403、404等）
│   │   ├── dashboard/       # 仪表盘
│   │   │   └── index.vue
│   │   ├── subjects/        # 科目管理
│   │   │   ├── list.vue
│   │   │   └── detail.vue
│   │   ├── question-types/  # 题型管理
│   │   │   └── list.vue
│   │   ├── questions/       # 题库管理
│   │   │   ├── list.vue
│   │   │   ├── detail.vue
│   │   │   └── import.vue
│   │   ├── materials/       # 学习资料
│   │   │   ├── list.vue
│   │   │   └── detail.vue
│   │   ├── exams/           # 考试配置
│   │   │   ├── list.vue
│   │   │   └── detail.vue
│   │   ├── scores/          # 成绩统计
│   │   │   ├── list.vue
│   │   │   └── stats.vue
│   │   ├── users/           # 用户管理
│   │   │   └── list.vue
│   │   ├── rbac/            # RBAC权限管理
│   │   │   ├── permissions.vue
│   │   │   ├── roles.vue
│   │   │   ├── menus.vue
│   │   │   └── admins.vue
│   │   └── progress/        # 答题进度（开发中）
│   │       └── list.vue
├── .env                     # 开发环境变量
├── .env.prod                # 生产环境变量
├── .env.test                # 测试环境变量
├── uno.config.ts            # UnoCSS配置
├── vite.config.ts           # Vite配置
├── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
├── vercel.json              # Vercel部署配置
├── AGENTS.md
├── admin-api.md             # 后端API完整文档
└── docs/
    ├── 01-overview.md
    ├── 02-feature-design.md
    ├── 03-architecture.md
    ├── 04-api-design.md
    ├── 05-dev-guide.md
    └── 06-task-list-phase1.md
```

## Conventions
- Vue3 + Vite7 + TypeScript + Pinia + ElementPlus + UnoCSS
- pnpm monorepo 架构（必须用pnpm，不能用npm/yarn）
- SoybeanAdmin 内置的 Elegant Router（文件路由自动生成）
- SoybeanAdmin 内置的 auth store + 权限路由系统
- API: Axios + Admin JWT Bearer token
- 中文界面

## Principles
- 基于 SoybeanAdmin 定制，不重写基础设施（登录/权限/路由/主题全保留）
- 只替换 mock 数据 → 真实 exam-server API
- 只新增业务页面（题库/成绩/考试配置/RBAC等）
- 修改 auth store 指向 exam-server 的 /admin/auth/login
- 修改路由权限配置指向 exam-server 的动态菜单（RBAC）

## API Info
- Base URL: `https://exam-server.hanbin123.com/api/v1`
- Auth: Admin JWT Bearer Token，7天有效期
- Response: `{ code: int, data: T, message: str }`
- 详细文档: [admin-api.md](admin-api.md)

## Pitfalls
- Don't use npm or yarn — 必须pnpm（monorepo要求）
- Don't rewrite SoybeanAdmin 的登录/权限系统 — 直接复用，只改API地址
- Don't hardcode API URL — 使用 .env 中的 VITE_API_BASE_URL
- Don't build server-side logic — 所有数据操作通过exam-server API
- Don't 删除 SoybeanAdmin 内置的 mock 系统 — 保留作为fallback，新增真实API层
- Don't 忘记 Elegant Router 的文件命名规则 — 路由自动从文件名生成

## Deployment
- Platform: Vercel (same account as exam frontend)
- Auto-deploy: GitHub push → Vercel builds → deploys
- Gitee → origin (日常开发), GitHub → 部署时push
- Environment: VITE_API_BASE_URL = https://exam-server.hanbin123.com/api/v1
- Domain: exam-admin.vercel.app

## Vercel Free Quota Check
- exam + exam-admin under same Hobby account
- Both pure SPA → no serverless functions consumed
- Edge Requests + Bandwidth shared → enough ✓

## Doc Index
- [admin-api.md](admin-api.md) — 后端API完整文档
- [01-overview.md](docs/01-overview.md) — Vision, template choice, priorities
- [02-feature-design.md](docs/02-feature-design.md) — Page specs with data interfaces
- [03-architecture.md](docs/03-architecture.md) — Tech stack, directory tree
- [04-api-design.md](docs/04-api-design.md) — Frontend API client design
- [05-dev-guide.md](docs/05-dev-guide.md) — Setup, config, dev workflow
- [06-task-list-phase1.md](docs/06-task-list-phase1.md) — Atomic implementation tasks