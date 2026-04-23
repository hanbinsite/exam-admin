# 01 — Overview

## Vision

exam-admin 是在线考试系统的管理后台，面向管理员提供题库管理、成绩统计、RBAC权限管理等功能。基于 SoybeanAdmin ElementPlus 模板定制，所有数据操作通过 exam-server API 完成。

## Pages (基于 admin-api.md)

| 页面 | 路径 | 功能 | API端点 |
|------|------|------|---------|
| 登录 | /login | 管理员邮箱密码登录 | `/admin/auth/login` |
| 仪表盘 | /dashboard | 系统概览（用户数、提交数、科目数） | `/admin/dashboard` |
| 科目管理 | /subjects | 科目 CRUD + 统计 | `/subjects` |
| 题型管理 | /question-types | 题型 CRUD（单选/多选/判断/填空/材料） | `/admin/question-types` |
| 题库管理 | /questions | 题目 CRUD + 批量导入 + 统计 | `/admin/questions`, `/subjects/{id}/questions/stats` |
| 学习资料 | /materials | 操指南/实操任务/案例分析 CRUD | `/admin/materials` |
| 考试配置 | /exams | 考试配置 CRUD + 抽题规则 | `/admin/exams` |
| 成绩统计 | /scores | 科目成绩统计 + 分数分布 + 分页列表 | `/admin/scores/stats`, `/admin/scores/list` |
| 用户管理 | /users | 学生用户分页列表 | `/admin/users` |
| RBAC权限 | /rbac | 角色/权限/菜单管理 + 科目授权 | `/admin/rbac/*` |
| 管理员管理 | /admins | 管理员列表 + 角色分配 + 科目授权 | `/admin/rbac/admins/*` |

## Priorities (Phase 1)

1. **登录 + 认证** — Admin JWT auth，路由守卫
2. **仪表盘** — 数据概览，系统状态一目了然
3. **科目管理** — 基础数据，所有业务依赖科目
4. **题型管理** — 题目创建前需先定义题型
5. **题库管理** — 核心功能，CRUD + 批量导入
6. **学习资料** — 实操指南/案例分析管理
7. **考试配置** — 考试项目配置 + 抽题规则
8. **成绩统计** — 分数分布可视化 + 分页列表
9. **用户管理** — 学生用户列表查看
10. **RBAC权限** — 角色/权限/菜单/科目授权管理（Phase 2）
11. **管理员管理** — 管理员账号 + 角色分配（Phase 2）

## Architecture Context

```
exam-admin (Vercel)           ← 管理后台前端 SPA (Vue3)
  ↓ fetch API (Admin JWT Bearer)
exam-server (Render)          ← FastAPI 后端
  ↓ connection pool
sqlpub MySQL                  ← 数据库
```

## Admin UI Template

选定 **SoybeanAdmin ElementPlus 版本** 作为管理后台基础模板：

| 候选方案 | Stars | 技术栈 | 登录+权限 | 样式 | 评估 |
|----------|-------|--------|-----------|------|------|
| **SoybeanAdmin ElPlus** ✅ | 14.2k | Vue3+Vite7+TS+Pinia+ElPlus+UnoCSS | ✅完整 | 清新优雅 | ✅ 推荐 |
| Ant Design Pro | 38.1k | React+Umi+AntD | ✅完整 | 企业风 | React生态 |
| vue-element-admin | 90.3k | Vue2+ElementUI | ✅完整 | 传统 | Vue2已过时 |

**选择理由**：
- ✅ 完整的登录页 + JWT认证 + 权限路由（无需重写基础设施）
- ✅ 最新技术栈（Vue3 + Vite7 + TypeScript + Pinia + ElementPlus）
- ✅ pnpm monorepo架构，代码组织清晰
- ✅ Elegant Router 文件路由自动生成
- ✅ ECharts 内置，适合统计图表
- ✅ ElementPlus 中文生态成熟

## API Base Info

| 配置项 | 值 |
|--------|-----|
| Base URL | `https://exam-server.hanbin123.com/api/v1` |
| 认证方式 | Admin JWT Bearer Token (`role=admin`) |
| 响应格式 | `{ code: int, data: T, message: str }` |
| Token 存储 | localStorage `admin_token` |
| Token 有效期 | 7 天 (`JWT_EXPIRE_DAYS_ADMIN`) |

## RBAC 权限体系

### 角色

| 角色 code | 名称 | is_super | 说明 |
|-----------|------|----------|------|
| super_admin | 超级管理员 | true | 绕过所有权限检查 |
| admin | 管理员 | false | 需科目授权 + 权限分配 |
| teacher | 教师 | false | 需科目授权 + 权限分配 |

### 9 个内置权限

| 权限 code | 名称 | 说明 |
|-----------|------|------|
| subject:manage | 科目管理 | 创建/编辑/删除科目 |
| question:manage | 题目管理 | 创建/编辑/删除题目 |
| question_type:manage | 题型管理 | 创建/编辑/删除题型 |
| material:manage | 资料管理 | 创建/编辑/删除学习资料 |
| exam:manage | 考试配置管理 | 创建/编辑考试配置 |
| score:view | 成绩查看 | 查看所有学生成绩 |
| grading:review | 主观题评阅 | 评阅主观题 |
| admin:manage | 管理员管理 | 创建/编辑管理员及角色 |
| dashboard:view | 仪表盘查看 | 查看管理仪表盘 |

### 科目级权限检查

- **Create 操作**: 从 request body 获取 `subject_id`，校验科目授权
- **Update/Delete 操作**: 先查询实体获取 `subject_id`，再校验
- **super_admin**: 绕过所有检查，无需 SubjectAdmin 分配

## Risks

| 风险 | 影响 | 对策 |
|------|------|------|
| exam-server 休眠时首次加载慢 | 管理员等待30秒 | 显示"正在连接服务器"loading |
| JWT 过期 | 操作中断 | 自动检测过期，跳转登录页 |
| 权限不足 | 功能受限 | 根据用户权限动态隐藏菜单 |
| 科目未授权 | 无法操作 | 提示"您未被授权管理此科目" |

## Doc Index

- [admin-api.md](../admin-api.md) — 后端API完整文档（1540行）
- [02-feature-design.md](02-feature-design.md) — 页面规格 + TypeScript接口
- [03-architecture.md](03-architecture.md) — 技术栈 + 目录结构
- [04-api-design.md](04-api-design.md) — 前端API客户端设计
- [05-dev-guide.md](05-dev-guide.md) — 开发指南 + 组件模式
- [06-task-list-phase1.md](06-task-list-phase1.md) — 任务分解