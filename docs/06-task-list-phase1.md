# 06 — Task List Phase 1

> 基于admin-api.md完整范围，按依赖关系排序

## T001: CloneSoybeanAdmin Template

- **Dependencies**: None
- **Time**: 0.5h
- **Acceptance**: pnpm install 成功，pnpm dev 正常启动，访问 localhost:3000 可见模板首页
- **Key files**: package.json, pnpm-workspace.yaml, src/main.ts
- **Cross-refs**: 05-dev-guide § Init Steps

## T002: API Client + Axios Interceptors

- **Dependencies**: T001
- **Time**: 1h
- **Acceptance**:
  - src/api/client.ts 可发送请求并自动附加 Admin JWT
  - 401 响应自动跳转登录页
  - 统一响应格式处理
- **Key files**: src/api/client.ts, src/typings/api.d.ts
- **Cross-refs**: 04-api-design § Base Client

## T003: Auth Store改造

- **Dependencies**: T001, T002
- **Time**: 1h
- **Acceptance**:
  - 登录调用 `/admin/auth/login`
  - token 存 localStorage
  - logout 清除 token 并跳转登录页
- **Key files**: src/store/modules/auth.ts, src/api/exam-server/auth.ts
- **Cross-refs**: 05-dev-guide § Auth 改造

## T004: Login Page改造

- **Dependencies**: T003
- **Time**: 0.5h
- **Acceptance**:
  - 登录表单提交成功后跳转 /dashboard
  - 失败显示错误提示（ElMessage）
- **Key files**: src/views/_builtin/login/index.vue
- **Cross-refs**: 05-dev-guide § 登录页改造

## T005: API Modules (全部)

- **Dependencies**: T002
- **Time**: 2h
- **Acceptance**: 所有API模块创建完成，类型定义完整
- **Key files**:
  - src/api/exam-server/auth.ts
  - src/api/exam-server/dashboard.ts
  - src/api/exam-server/subjects.ts
  - src/api/exam-server/question-types.ts
  - src/api/exam-server/questions.ts
  - src/api/exam-server/materials.ts
  - src/api/exam-server/exams.ts
  - src/api/exam-server/scores.ts
  - src/api/exam-server/users.ts
  - src/api/exam-server/rbac.ts
- **Cross-refs**: 04-api-design § API Modules

## T006: 类型定义

- **Dependencies**: T001
- **Time**: 1h
- **Acceptance**: 所有业务类型定义完整，API响应类型正确
- **Key files**: src/typings/business.d.ts, src/typings/api.d.ts
- **Cross-refs**: 05-dev-guide § 类型定义

## T007: Dashboard Page

- **Dependencies**: T003, T005
- **Time**: 1.5h
- **Acceptance**:
  - 3个统计卡片正常显示
  - 调用 `/admin/dashboard` 获取数据
- **Key files**: src/views/dashboard/index.vue, src/api/exam-server/dashboard.ts
- **Cross-refs**: 02-feature-design § Page 2: Dashboard

## T008: Subject Management

- **Dependencies**: T003, T005, T006
- **Time**: 2h
- **Acceptance**:
  - 科目列表表格正常显示
  - 新增/编辑弹窗可用
  - 删除有确认对话框
  - 状态开关（is_active）可用
- **Key files**: src/views/subjects/list.vue, src/api/exam-server/subjects.ts
- **Cross-refs**: 02-feature-design § Page 3: Subject Management

## T009: Question Type Management

- **Dependencies**: T003, T005, T006
- **Time**: 1.5h
- **Acceptance**:
  - 左侧科目选择器
  - 题型列表按科目筛选
  - 新增/编辑/删除功能正常
- **Key files**: src/views/question-types/list.vue, src/api/exam-server/question-types.ts
- **Cross-refs**: 02-feature-design § Page 4: Question Type Management

## T010: Question Management - List & Stats

- **Dependencies**: T008, T009, T005
- **Time**: 2h
- **Acceptance**:
  - 科目选择器 + 题型统计卡片
  - 题目列表表格（筛选、分页）
  - 调用 `/subjects/{id}/questions/stats`
- **Key files**: src/views/questions/list.vue, src/api/exam-server/questions.ts
- **Cross-refs**: 02-feature-design § Page 5: Question Management

## T011: Question Management - Form & CRUD

- **Dependencies**: T010
- **Time**: 3h
- **Acceptance**:
  - 新增/编辑弹窗表单
  - 选项编辑器（动态增删选项）
  - 删除确认对话框
- **Key files**: src/views/questions/detail.vue, src/components/question/QuestionForm.vue
- **Cross-refs**: 05-dev-guide § QuestionForm 组件

## T012: Question Batch Import

- **Dependencies**: T010
- **Time**: 1.5h
- **Acceptance**:
  - JSON文件上传
  - JSON文本粘贴
  - 调用 `/admin/questions/batch`
  - 显示导入结果（created/skipped）
- **Key files**: src/views/questions/import.vue
- **Cross-refs**: 02-feature-design § Page 5: Question Management

## T013: Material Management

- **Dependencies**: T003, T005, T006
- **Time**: 2h
- **Acceptance**:
  - 科目选择器 + 类型Tab切换
  - 资料 CRUD 功能正常
  - 富文本编辑器编辑 content
- **Key files**: src/views/materials/list.vue, src/views/materials/detail.vue
- **Cross-refs**: 02-feature-design § Page 6: Material Management

## T014: Exam Config Management

- **Dependencies**: T003, T005, T006
- **Time**: 2h
- **Acceptance**:
  - 考试列表 + CRUD
  - 抽题规则编辑器（按题型设置数量/随机/固定）
  - 评分规则编辑器
  - 启用/禁用开关
- **Key files**: src/views/exams/list.vue, src/views/exams/detail.vue
- **Cross-refs**: 02-feature-design § Page 7: Exam Config

## T015: Score Statistics

- **Dependencies**: T003, T005, T006
- **Time**: 2h
- **Acceptance**:
  - 科目选择器
  - 统计卡片（平均分、最高分、最低分、提交数）
  - 分数分布柱状图（ECharts）
  - 成绩列表表格（分页）
- **Key files**: src/views/scores/list.vue, src/views/scores/stats.vue
- **Cross-refs**: 02-feature-design § Page 8: Score Statistics

## T016: User Management

- **Dependencies**: T003, T005
- **Time**: 1h
- **Acceptance**:
  - 用户列表表格（分页）
  - 搜索框（前端过滤）
- **Key files**: src/views/users/list.vue, src/api/exam-server/users.ts
- **Cross-refs**: 02-feature-design § Page 9: User Management

## T017: RBAC - Permissions

- **Dependencies**: T003, T005, T006
- **Time**: 1h
- **Acceptance**:
  - 权限列表表格
  - 新增/编辑/删除权限
- **Key files**: src/views/rbac/permissions.vue
- **Cross-refs**: 02-feature-design § Page 10: RBAC Management

## T018: RBAC - Roles

- **Dependencies**: T017
- **Time**: 1.5h
- **Acceptance**:
  - 角色列表 + 详情
  - 角色权限分配（Checkbox多选）
  - 角色菜单分配（树形Checkbox）
- **Key files**: src/views/rbac/roles.vue
- **Cross-refs**: 02-feature-design § Page 10: RBAC Management

## T019: RBAC - Admins

- **Dependencies**: T018
- **Time**: 1.5h
- **Acceptance**:
  - 管理员列表
  - 角色分配下拉框
  - 科目授权管理
  - 新增管理员（调用 `/admin/auth/register`）
- **Key files**: src/views/rbac/admins.vue
- **Cross-refs**: 02-feature-design § Page 10: RBAC Management

## T020: RBAC - Menus

- **Dependencies**: T017
- **Time**: 1.5h
- **Acceptance**:
  - 树形表格展示菜单层级
  - 新增/编辑/删除菜单
- **Key files**: src/views/rbac/menus.vue
- **Cross-refs**: 02-feature-design § Page 10: RBAC Management

## T021: 路由配置

- **Dependencies**: T007-T020
- **Time**: 1h
- **Acceptance**:
  - 所有业务路由配置完成
  - 侧边栏菜单正确显示
- **Key files**: src/router/routes/modules/exam-server/*.ts
- **Cross-refs**: 05-dev-guide § 路由配置

## T022: 权限控制集成

- **Dependencies**: T021, T019
- **Time**: 1.5h
- **Acceptance**:
  - 登录后获取管理员菜单
  - 侧边栏动态显示有权限的菜单
  - super_admin 显示完整菜单
- **Key files**: src/store/modules/auth.ts, src/router/guard.ts

## T023: Vercel Deployment

- **Dependencies**: All above
- **Time**: 0.5h
- **Acceptance**:
  - vercel.json 配置 SPA 路由
  - VITE_API_BASE_URL 环境变量设置
  - push 后自动部署成功
- **Key files**: vercel.json, .env.prod
- **Cross-refs**: 05-dev-guide § 部署

---

## Task Dependency Graph

```
T001 (Clone Template)
├── T002 (API Client)
│   └── T005 (API Modules) ──┬── T007 (Dashboard)
│                            ├── T008 (Subjects)
│                            │   └── T010 (Questions List)
│                            │       └── T011 (Questions Form)
│                            │       └── T012 (Batch Import)
│                            ├── T009 (Question Types)
│                            ├── T013 (Materials)
│                            ├── T014 (Exams)
│                            ├── T015 (Scores)
│                            ├── T016 (Users)
│                            └── T017 (RBAC Permissions)
│                                ├── T018 (RBAC Roles)
│                                │   └── T019 (RBAC Admins)
│                                └── T020 (RBAC Menus)
├── T003 (Auth Store)
│   └── T004 (Login Page)
└── T006 (TypeScript Types)

T007-T020 ──→ T021 (Routes) ──→ T022 (Permission Control) ──→ T023 (Deploy)
```

---

## Phase 1 Scope (Priority)

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | T001-T006 | 基础设施 |
| P0 | T007 | 仪表盘 |
| P0 | T008-T009 | 科目 + 题型管理 |
| P0 | T010-T012 | 题库管理（核心功能） |
| P1 | T013 | 学习资料 |
| P1 | T014 | 考试配置 |
| P1 | T015 | 成绩统计 |
| P1 | T016 | 用户管理 |
| P2 | T017-T020 | RBAC权限管理 |
| P2 | T021-T023 | 路由 + 权限控制 + 部署 |

---

## Estimated Total Time

| Phase | Tasks | Time |
|-------|-------|------|
| P0基础设施 | T001-T006 | 6h |
| P0核心功能 | T007-T012 | 12h |
| P1次要功能 | T013-T016 | 6h |
| P2 RBAC | T017-T020 | 5.5h |
| P2集成部署 | T021-T023 | 3h |
| **Total** | **23 tasks** | **32.5h** |