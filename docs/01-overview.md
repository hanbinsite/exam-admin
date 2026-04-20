# 01 — Overview

## Vision
exam-admin 是在线考试系统的管理后台，面向管理员提供题库管理、成绩统计、用户管理等功能。纯前端 SPA，所有数据操作通过 exam-server API 完成。

## Pages
| 页面 | 路径 | 功能 |
|------|------|------|
| 登录 | /login | 管理员邮箱密码登录 |
| 仪表盘 | /dashboard | 数据概览（题目数、提交数、平均分） |
| 题库管理 | /questions | 选择题/判断题 CRUD + 批量导入 |
| 案例分析 | /case-analysis | 案例分析 CRUD |
| 实操管理 | /practice | 实操任务 CRUD + 前置步骤编辑 |
| 成绩统计 | /scores | 成绩列表 + 分数分布图 |
| 答题进度 | /progress | 查看用户进度（开发中） |
| 考试配置 | /exams | 考试项目配置 CRUD |
| 用户管理 | /users | 管理员账号管理 |

## Priorities
1. **登录 + 认证** — JWT auth, 所有页面需登录后访问
2. **仪表盘** — 首页数据概览，一眼看懂系统状态
3. **题库管理** — 最核心功能，CRUD + 批量导入
4. **成绩统计** — 分数分布可视化
5. **案例分析 & 实操管理** — 次核心功能
6. **考试配置 & 用户管理** — 辅助功能

## Architecture Context
```
exam-admin (Vercel)        ← 管理后台前端 SPA
  ↓ fetch API (JWT Bearer)
exam-server (Render)       ← FastAPI 后端
  ↓ connection pool
sqlpub MySQL               ← 数据库
```

## Admin UI Template Selection
选定 **SoybeanAdmin ElementPlus 版本** 作为管理后台基础模板：

| 候选方案 | Stars | 技术栈 | 登录+权限 | 样式 | 评估 |
|----------|-------|--------|-----------|------|------|
| **SoybeanAdmin ElPlus** ✅ | 14.2k | Vue3+Vite7+TS+Pinia+ElPlus+UnoCSS | ✅完整 | 清新优雅 | ✅ 推荐 |
| Ant Design Pro | 38.1k | React+Umi+AntD | ✅完整 | 企业风 | React生态，偏重 |
| vue-element-admin | 90.3k | Vue2+ElementUI | ✅完整 | 传统 | Vue2已过时，技术栈旧 |
| shadcn/ui | 113k | React+Tailwind+Radix | ❌无 | 极简现代 | 只有组件，无登录/权限 |

**选择 SoybeanAdmin ElementPlus 的理由**：
- ✅ 完整的登录页 + JWT认证 + 权限路由（不用重写基础设施）
- ✅ 最新技术栈（Vue3 + Vite7 + TypeScript + Pinia）
- ✅ 清新优雅的UI样式，高颜值
- ✅ pnpm monorepo架构，代码组织清晰
- ✅ 自动文件路由系统（Elegant Router）
- ✅ 中文社区活跃，B站有教程
- ✅ ElementPlus 中文生态成熟
- ✅ 多版本可选（NaiveUI/AntD/ElPlus），ElPlus最适合中文考试系统
- ✅ 2026年3月仍活跃更新（v2.1.0）

**GitHub**: https://github.com/soybeanjs/soybean-admin-element-plus
**Gitee**: https://gitee.com/honghuangdc/soybean-admin-element-plus
**预览**: https://elp.soybeanjs.cn/

## Risks
| 风险 | 影响 | 对策 |
|------|------|------|
| exam-server 休眠时首次加载慢 | 管理员等待30秒 | 显示"正在连接服务器"loading |
| JWT 过期 | 操作中断 | 自动检测过期，跳转登录页 |
| shadcn/ui 组件不全 | 部分UI需手写 | 核心表格/表单/卡片都有 |