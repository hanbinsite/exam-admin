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

## Structure (实际目录，基于SoybeanAdmin定制)
```
exam-admin/
├── packages/               # pnpm monorepo
│   ├── locales/            # 国际化语言包
│   ├── utils/              # 工具函数
│   ├── colors/             # 颜色配置
│   ├── constants/          # 常量定义
│   ├── themes/             # 主题配置
│   └── icons/              # 图标资源
├── src/
│   ├── main.ts             # 入口
│   ├── App.vue             # 根组件
│   ├── constants/          # 业务常量
│   │   ├── permissions.ts  # 权限code常量
│   │   └── question-types.ts # 题型预设
│   ├── enum/               # SetupStoreId等枚举
│   ├── hooks/              # 组合式函数
│   │   └── business/auth.ts # 权限检查hook
│   ├── layouts/            # 布局组件（内置，可直接使用）
│   ├── locales/            # i18n (zh-cn, en-us)
│   ├── plugins/            # 插件配置
│   ├── router/             # 路由（Elegant Router自动生成）
│   │   ├── elegant/        # 自动生成的路由映射
│   │   │   ├── imports.ts  # 视图组件懒加载映射
│   │   │   ├── routes.ts   # (已删除，动态模式不需要)
│   │   │   └── transform.ts # 路由转换函数 + routeMap
│   │   ├── guard/          # 路由守卫
│   │   └── routes/         # 静态路由（builtin）
│   ├── service/            # API服务层（Axios）
│   │   ├── api/            # exam-server API模块
│   │   │   ├── auth.ts     # 管理员认证 (5个)
│   │   │   ├── dashboard.ts # 仪表盘 (1个)
│   │   │   ├── subjects.ts # 科目管理 (5个)
│   │   │   ├── question-types.ts # 题型管理 (4个)
│   │   │   ├── questions.ts # 题目管理 (6个)
│   │   │   ├── materials.ts # 学习资料 (4个)
│   │   │   ├── exams.ts    # 考试配置 (6个)
│   │   │   ├── exam-sessions.ts # 考试场次 (2个)
│   │   │   ├── scores.ts   # 成绩统计 (2个)
│   │   │   ├── users.ts    # 用户管理 (5个)
│   │   │   ├── rbac.ts     # RBAC权限管理 (22个)
│   │   │   ├── knowledge-points.ts # 知识点管理 (6个)
│   │   │   ├── route.ts    # 动态菜单 (1个)
│   │   │   └── index.ts    # 统一导出
│   │   └── request/        # Axios封装
│   ├── service-alova/      # Alova替代层（未使用，SoybeanAdmin残留）
│   ├── store/              # Pinia状态管理
│   │   ├── modules/
│   │   │   ├── auth/       # 认证状态（已改造：调 /admin/auth/login）
│   │   │   ├── exam.ts     # 考试状态（科目选择，各页面复用）
│   │   │   ├── route/      # 动态路由状态（从/admin/auth/menus获取）
│   │   │   ├── app/        # 应用设置（内置）
│   │   │   ├── theme/      # 主题配置（内置）
│   │   │   └── tab/        # 标签页（内置）
│   ├── theme/              # 主题设置（内置）
│   ├── typings/            # 类型定义
│   │   ├── api/
│   │   │   ├── exam.d.ts   # Exam命名空间（主要业务类型）
│   │   │   ├── auth.d.ts   # 旧Api.Auth（SoybeanAdmin残留）
│   │   │   ├── common.d.ts # 旧Api.Common（SoybeanAdmin残留）
│   │   │   ├── route.d.ts  # Api.Route
│   │   │   └── system-manage.d.ts # 旧Api.SystemManage（SoybeanAdmin残留）
│   │   └── elegant-router.d.ts # Elegant Router类型
│   ├── utils/              # 工具函数
│   └── views/              # 页面视图
│       ├── _builtin/       # 内置页面（登录、403、404等）
│       ├── dashboard/      # 仪表盘
│       │   └── index.vue   # 统计卡片（total_users/submissions/subjects）
│       ├── subjects/       # 科目管理
│       │   └── list.vue    # ✅ 完整CRUD
│       ├── question-types/ # 题型管理
│       │   └── list.vue    # ✅ 完整CRUD
│       ├── questions/      # 题库管理
│       │   └── list.vue    # ✅ 完整CRUD + 批量导入
│       ├── knowledge-points/ # 知识点管理
│       │   └── list.vue    # ✅ 完整CRUD（树形结构）
│       ├── materials/      # 学习资料
│       │   └── list.vue    # ✅ 完整CRUD
│       ├── exams/          # 考试配置
│       │   ├── list.vue    # ✅ 完整CRUD
│       │   └── sessions.vue # 考试场次管理
│       ├── scores/         # 成绩统计
│       │   └── list.vue    # ✅ 只读（统计卡片+分页列表）
│       ├── users/          # 用户管理
│       │   └── list.vue    # ✅ 服务端搜索+激活/停用/重置密码
│       ├── rbac/           # RBAC权限管理
│       │   ├── permissions.vue # ✅ 完整CRUD
│       │   ├── roles.vue   # ✅ 完整CRUD+权限分配+菜单分配
│       │   ├── menus.vue   # ✅ 完整CRUD+角色菜单分配
│       │   └── admins.vue  # ✅ 完整CRUD+角色/科目授权
│       └── user-center/    # 个人中心
│           └── index.vue   # 个人资料编辑+修改密码
├── .env                    # 开发环境变量 (VITE_AUTH_ROUTE_MODE=dynamic)
├── .env.prod               # 生产环境变量
├── .env.test               # 测试环境变量
├── uno.config.ts           # UnoCSS配置
├── vite.config.ts          # Vite配置
├── package.json            # @sa/elp (SoybeanAdmin ElementPlus)
├── pnpm-workspace.yaml     # pnpm工作区
├── vercel.json             # Vercel部署配置 (SPA rewrite)
├── AGENTS.md               # 本文件
├── admin-api.md            # 后端API完整文档
└── docs/                   # 设计文档
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
- SoybeanAdmin 内置的 auth store + 权限路由系统（已改造为exam-server API）
- API: Axios + Admin JWT Bearer token
- 动态路由模式: VITE_AUTH_ROUTE_MODE=dynamic，菜单从 /admin/auth/menus 获取
- 中文界面
- 类型定义在 `Exam.*` 命名空间（exam.d.ts），不用旧的 `Api.*`

## Principles
- 基于 SoybeanAdmin 定制，不重写基础设施（登录/权限/路由/主题全保留）
- 只替换 mock 数据 → 真实 exam-server API
- 只新增业务页面（题库/成绩/考试配置/RBAC等）
- auth store 指向 exam-server 的 /admin/auth/login
- 路由权限配置指向 exam-server 的动态菜单（/admin/auth/menus）
- 科目选择复用 useExamStore，避免各页面重复调 fetchSubjectList

## API Info
- Base URL: `https://exam-server.hanbin123.com/api/v1`
- Auth: Admin JWT Bearer Token，7天有效期
- Response: `{ code: int, data: T, message: str }`
- Success code: 200
- Error codes: 400(参数错误) | 401(未登录) | 403(权限不足) | 404(不存在) | 409(冲突) | 429(限流)
- 详细文档: [admin-api.md](admin-api.md)

## RBAC 权限体系
- 角色: super_admin(超管,绕过所有检查) | admin(需科目授权+权限) | teacher(需科目授权+权限)
- 9个内置权限: subject:manage, question:manage, question_type:manage, material:manage, exam:manage, score:view, grading:review, admin:manage, dashboard:view
- 科目级权限: admin/teacher需同时拥有权限code + SubjectAdmin科目授权
- super_admin无需科目授权

## Pitfalls
- Don't use npm or yarn — 必须pnpm（monorepo要求）
- Don't rewrite SoybeanAdmin 的登录/权限系统 — 直接复用，只改API地址
- Don't hardcode API URL — 使用 .env 中的 VITE_SERVICE_BASE_URL
- Don't build server-side logic — 所有数据操作通过exam-server API
- Don't 忘记 Elegant Router 的文件命名规则 — 路由自动从文件名生成，新增视图需运行 pkm dev 重新生成路由文件
- Don't 使用旧的 Api.* 类型命名空间 — 业务类型统一用 Exam.*
- DELETE请求传body用data而非params（Axios的params会变成query string）
- 用户搜索必须传keyword参数到API（服务端搜索），不要客户端过滤
- 登录接口用email而非username

## Deployment
- Platform: Vercel (same account as exam frontend)
- Auto-deploy: GitHub push → Vercel builds → deploys
- Gitee → origin (日常开发), GitHub → 部署时push
- Environment: VITE_SERVICE_BASE_URL = https://exam-server.hanbin123.com/api/v1
- Domain: exam-admin.vercel.app

## Doc Index
- [admin-api.md](admin-api.md) — 后端API完整文档
- [01-overview.md](docs/01-overview.md) — Vision, template choice, priorities
- [02-feature-design.md](docs/02-feature-design.md) — Page specs with data interfaces
- [03-architecture.md](docs/03-architecture.md) — Tech stack, directory tree
- [04-api-design.md](docs/04-api-design.md) — Frontend API client design
- [05-dev-guide.md](docs/05-dev-guide.md) — Setup, config, dev workflow
- [06-task-list-phase1.md](docs/06-task-list-phase1.md) — Atomic implementation tasks
