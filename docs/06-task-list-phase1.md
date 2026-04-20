# 06 — Task List Phase 1

## T001: Project Setup + shadcn/ui Init
- **Dependencies**: None
- **Time**: 1h
- **Acceptance**: Vite + React + TypeScript + Tailwind + shadcn/ui 项目可运行，npm run dev 正常启动
- **Key files**: package.json, vite.config.ts, tailwind.config.ts, components.json, src/main.tsx, src/styles/globals.css
- **Cross-refs**: 03-architecture §Tech Stack, 05-dev-guide §Init Steps

## T002: API Client + Auth Infrastructure
- **Dependencies**: T001
- **Time**: 1.5h
- **Acceptance**: api/client.ts 可发送请求并附带 JWT，AuthContext 提供 login/logout，路由守卫拦截未认证访问
- **Key files**: src/api/client.ts, src/contexts/AuthContext.tsx, src/hooks/useAuth.ts, src/lib/auth.ts, src/router.tsx
- **Cross-refs**: 04-api-design §Base Client, §Auth Flow

## T003: SidebarLayout + Header + Sidebar
- **Dependencies**: T001, T002
- **Time**: 1.5h
- **Acceptance**: 侧边栏导航正常显示，Header 显示用户名+退出按钮，所有认证页面被 SidebarLayout 包裹
- **Key files**: src/components/layout/SidebarLayout.tsx, Sidebar.tsx, Header.tsx, Breadcrumb.tsx
- **Cross-refs**: 05-dev-guide §SidebarLayout pattern

## T004: Login Page
- **Dependencies**: T002
- **Time**: 1h
- **Acceptance**: 登录表单提交成功后跳转 /dashboard，失败显示错误提示，JWT 存入 localStorage
- **Key files**: src/pages/login/LoginPage.tsx
- **Cross-refs**: 02-feature-design §Page 1: Login

## T005: Dashboard Page
- **Dependencies**: T003, T002
- **Time**: 2h
- **Acceptance**: 4个统计卡片 + 分数分布柱状图 + 最近提交列表正常显示
- **Key files**: src/pages/dashboard/DashboardPage.tsx, src/components/shared/StatCard.tsx, ScoreChart.tsx
- **Cross-refs**: 02-feature-design §Page 2: Dashboard

## T006: DataTable + Pagination Component
- **Dependencies**: T001
- **Time**: 1.5h
- **Acceptance**: Generic DataTable 支持 TanStack Table 的排序/分页/筛选
- **Key files**: src/components/shared/DataTable.tsx
- **Cross-refs**: 05-dev-guide §DataTable pattern

## T007: Question Management Page
- **Dependencies**: T003, T006, T002
- **Time**: 3h
- **Acceptance**: 题目列表表格可筛选/分页，新增/编辑弹窗表单可提交，删除有确认对话框，批量导入可上传JSON
- **Key files**: src/pages/questions/QuestionsPage.tsx, QuestionForm.tsx, BatchImport.tsx, src/api/questions.ts
- **Cross-refs**: 02-feature-design §Page 3: Question Management

## T008: Case Analysis Page
- **Dependencies**: T003, T002
- **Time**: 1.5h
- **Acceptance**: 案例分析列表展示，新增/编辑表单可用
- **Key files**: src/pages/case-analysis/CaseAnalysisPage.tsx, src/api/case-analysis.ts
- **Cross-refs**: 02-feature-design §Page 4: Case Analysis

## T009: Practice Management Page
- **Dependencies**: T003, T002
- **Time**: 2h
- **Acceptance**: BaseSteps 编辑 + PracticeTask CRUD + 步骤编辑器可用
- **Key files**: src/pages/practice/PracticePage.tsx, src/api/practice.ts
- **Cross-refs**: 02-feature-design §Page 5: Practice Management

## T010: Score Statistics Page
- **Dependencies**: T003, T005 (chart component), T006
- **Time**: 2h
- **Acceptance**: 统计卡片 + 分数分布图 + 成绩列表表格 + 分页 + CSV导出
- **Key files**: src/pages/scores/ScoresPage.tsx, ScoreChart.tsx, src/api/scores.ts
- **Cross-refs**: 02-feature-design §Page 6: Score Statistics

## T011: Exam Config Page
- **Dependencies**: T003, T006, T002
- **Time**: 1h
- **Acceptance**: 考试列表 CRUD，启用/禁用开关
- **Key files**: src/pages/exams/ExamsPage.tsx, src/api/exams.ts
- **Cross-refs**: 02-feature-design §Page 7: Exam Config

## T012: User Management Page
- **Dependencies**: T003, T006, T002
- **Time**: 1h
- **Acceptance**: 用户列表 + 新增管理员 + 删除用户
- **Key files**: src/pages/users/UsersPage.tsx
- **Cross-refs**: 02-feature-design §Page 8: User Management

## T013: Progress Viewer Page
- **Dependencies**: T003, T002
- **Time**: 1h
- **Acceptance**: 查看某用户的答题进度
- **Key files**: src/pages/progress/ProgressPage.tsx, src/api/progress.ts
- **Cross-refs**: 02-feature-design §Progress

## T014: Vercel Deployment Setup
- **Dependencies**: All above
- **Time**: 0.5h
- **Acceptance**: vercel.json 配置 SPA 路由，VITE_API_BASE_URL 环境变量设置，push 后自动部署
- **Key files**: vercel.json, package.json, .env.production
- **Cross-refs**: 05-dev-guide §Deployment