# 03 — Architecture

## Tech Stack

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | Vue | 3.x | SoybeanAdmin内置 |
| Language | TypeScript | 5.x | SoybeanAdmin内置 |
| Build | Vite | 7.x | SoybeanAdmin内置 |
| UI Library | Element Plus | latest | SoybeanAdmin ElPlus版本 |
| CSS | UnoCSS | latest | SoybeanAdmin内置（原子化CSS） |
| State | Pinia | latest | SoybeanAdmin内置 |
| Routing | Elegant Router | latest | SoybeanAdmin文件路由自动生成 |
| HTTP Client | Axios | latest | SoybeanAdmin内置 |
| Auth | Admin JWT (localStorage) | — | 改造SoybeanAdmin内置auth store |
| Charts | ECharts | latest | SoybeanAdmin内置 |
| Icons | Iconify | latest | SoybeanAdmin内置 |
| i18n | @saofeng/locale | latest | SoybeanAdmin内置国际化 |
| Package Manager | pnpm | 10.5+ | monorepo要求 |

## Directory Tree (基于SoybeanAdmin定制)

```
exam-admin/
├── packages/                  # pnpm monorepo 子包
│   ├── locales/               # 国际化语言包
│   ├── utils/                 # 工具函数
│   ├── colors/                # 颜色配置
│   ├── constants/             # 常量定义
│   ├── themes/                # 主题配置
│   └── icons/                 # 图标资源
├── src/
│   ├── main.ts                # 入口
│   ├── App.vue                # 根组件
│   ├── api/                   # API调用层
│   │   ├── client.ts          # Axios实例 + JWT拦截器
│   │   └── exam-server/       # exam-server API模块
│   │       ├── auth.ts        # 管理员认证
│   │       ├── dashboard.ts   # 仪表盘
│   │       ├── subjects.ts    # 科目管理
│   │       ├── question-types.ts  # 题型管理
│   │       ├── questions.ts   # 题目管理
│   │       ├── materials.ts   # 学习资料
│   │       ├── exams.ts       # 考试配置
│   │       ├── scores.ts      # 成绩统计
│   │       ├── users.ts       # 用户管理
│   │       └── rbac.ts        # RBAC权限管理
│   ├── constants/             # 业务常量
│   │   ├── permissions.ts     # 权限code常量
│   │   └── question-types.ts  # 题型预设
│   ├── dao/                   # 数据访问（SoybeanAdmin内置）
│   ├── layouts/               # 布局组件（内置，可直接使用）
│   ├── plugins/               # 插件配置
│   ├── router/                # Elegant Router 自动生成
│   │   ├── routes/            # 路由模块
│   │   │   └── exam-server/   # 业务路由模块
│   ├── store/                 # Pinia状态管理
│   │   └── modules/
│   │       ├── auth.ts        # 认证状态（改造：调 /admin/auth/login）
│   │       └── exam.ts        # 考试相关状态（科目选择等）
│   ├── theme/                 # 主题设置（内置）
│   ├── typings/               # 类型定义
│   │   ├── api.d.ts           # API通用类型
│   │   └── business.d.ts      # 业务类型
│   ├── utils/                 # 工具函数
│   └── views/                 # 页面视图
│       ├── _builtin/          # 内置页面（登录、403、404等）
│       ├── dashboard/         # 仪表盘
│       │   └── index.vue
│       ├── subjects/          # 科目管理
│       │   ├── list.vue       # 科目列表
│       │   └── detail.vue     # 科目详情/编辑
│       ├── question-types/    # 题型管理
│       │   └── list.vue
│       ├── questions/         # 题库管理
│       │   ├── list.vue       # 题目列表
│       │   ├── detail.vue     # 题目详情/编辑
│       │   └── import.vue     # 批量导入
│       ├── materials/         # 学习资料
│       │   ├── list.vue       # 资料列表
│       │   └── detail.vue     # 资料编辑
│       ├── exams/             # 考试配置
│       │   ├── list.vue       # 考试列表
│       │   └── detail.vue     # 考试配置编辑
│       ├── scores/            # 成绩统计
│       │   ├── list.vue       # 成绩列表
│       │   └── stats.vue      # 统计图表
│       ├── users/             # 用户管理
│       │   └── list.vue
│       ├── rbac/              # RBAC权限管理
│       │   ├── permissions.vue  # 权限管理
│       │   ├── roles.vue        # 角色管理
│       │   ├── menus.vue        # 菜单管理
│       │   └── admins.vue       # 管理员管理
│       └── progress/          # 答题进度（开发中）
│           └── list.vue
├── .env                       # 开发环境变量
├── .env.prod                  # 生产环境变量
├── .env.test                  # 测试环境变量
├── uno.config.ts              # UnoCSS配置
├── vite.config.ts             # Vite配置
├── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
├── vercel.json                # Vercel部署配置
├── AGENTS.md
└── docs/
```

## Data Flow

```
用户操作 Vue 组件
  → 调用 src/api/exam-server/ 中的API函数
    → Axios 实例自动附加 Admin JWT Bearer header
      → HTTP 请求到 exam-server API
        → exam-server 校验 JWT + RBAC权限 → 处理请求 → 返回 JSON
          → Axios 响应拦截器处理统一响应格式
            → Pinia store 更新状态
              → Vue 组件响应式更新
                → ElMessage 提示（成功/失败）
```

## Auth Flow

```
SoybeanAdmin 内置登录页 → 改造为调 /admin/auth/login
  → 收到 { token, admin } → token 存 localStorage
    → SoybeanAdmin 内置 auth store 读取 token → 标记已认证
      → Elegant Router 路由守卫：未认证 → 重定向 /login
      → 内置 Layout 包裹所有认证页面
        → Header 显示管理员姓名 + 退出按钮
          → 退出 → 清除 localStorage → 重定向 /login

JWT 过期 → Axios 响应拦截器检测 401 → 清除 token → 重定向 /login
```

## RBAC + 动态菜单 Flow

```
管理员登录成功
  → 获取 admin.role (super_admin/admin/teacher)
    → 调用 GET /admin/rbac/admins/{id}/menus 获取该管理员可见菜单
      → SoybeanAdmin 动态路由系统加载对应页面
        → 侧边栏只显示有权限的菜单项
          → 操作时 Axios 请求 → exam-server 校验具体权限 code

super_admin 特殊处理：
  → 返回完整菜单树，无需权限检查
  → 所有操作绕过科目级授权
```

## API 响应格式

所有接口统一返回：

```typescript
interface ApiResponse<T> {
  code: number;      // 200成功 | 400参数错误 | 401未登录 | 403权限不足 | 404不存在 | 409冲突
  data: T | null;    // 业务数据
  message: string;   // 提示信息
}
```

## Error Handling Strategy

| 场景 | 处理方式 |
|------|----------|
| 401 未登录 | 清除token，重定向 /login |
| 403 权限不足 | ElMessage.error 提示"权限不足" |
| 404 资源不存在 | ElMessage.warning 提示，返回列表页 |
| 409 冲突 | ElMessage.warning 提示具体冲突原因 |
| 网络错误 | ElMessage.error "网络连接失败" |
| 服务器休眠 | Loading 态 + "正在连接服务器..." |

## Deployment

```
exam-admin → Vercel (Hobby free)
  → pnpm build → dist/ → 纯静态SPA
  → Environment: VITE_API_BASE_URL = https://exam-server.hanbin123.com/api/v1
  → Domain: exam-admin.vercel.app
  → vercel.json: SPA路由重写

日常开发: Gitee (origin)
部署: push到GitHub → Vercel自动构建
```