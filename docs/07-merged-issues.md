# exam-admin 未完成事项清单（代码验证版 v3）

> 基于 2026-04-29 最新代码 (6982223) + 2026-04-29 修复
> 已验证：67项中 61项已实现/已修复/假阳性，6项仍为低优先级

---

## 一、Bug（已全部修复）

| # | 问题 | 修复内容 | 状态 |
|---|------|---------|------|
| B07 | `onBackendFail` 后端错误静默 | 初始化 `window.$message`/`$notification`/`$messageBox` → `src/plugins/ui.ts:29-31` | ✅ **已修复** |
| B03 | questions 编辑丢失 content/explanation/tags | `handleEdit` 改为 async + 调 `fetchQuestionDetail`（需后端 `GET /admin/questions/{id}`） | ✅ **已修复** |

---

## 二、设计规格（14项已实现，6项低优先级未实现）

### ✅ 2026-04-29 本次修复新增的 8 项

| # | 页面 | 实现内容 |
|---|------|---------|
| G02 | dashboard | ECharts 柱状图展示各科题目数/资料数/考试数 |
| G04 | question-types | "初始化预设"按钮 — 一键创建5种题型 |
| G05 | questions | ECharts 饼图展示难度分布 (简单/中等/困难) |
| G12 | questions | 分类筛选文本框 → 自动提取分类下拉 |
| G14 | questions | 查看详情只读视图 (`ElDescriptions`) |
| G16 | materials | content 编辑/HTML 预览双模式切换 |
| G19 | materials | 列表/卡片模式切换 (`ElButtonGroup`) |

### ✅ 此前已实现（原文档误标记）

| # | 功能 | 位置 |
|---|------|------|
| G01 | Dashboard 科目列表 | `dashboard/index.vue:55-75` |
| G06 | 选项编辑器 | `questions/list.vue:99-124, 476-497` |
| G07 | 判断题选择器 | `questions/list.vue:499-504` |
| G08 | 填空题答案框 | `questions/list.vue:523-525` |
| G10 | content.options 编辑 | `questions/list.vue:110-116` |
| G11 | 标签编辑 UI | `questions/list.vue:126-136` |
| G13 | JSON 文件导入 | `questions/list.vue:291-303` |
| G18 | Materials 标签编辑 | `materials/list.vue:137-145` |
| G20 | 抽题规则编辑器 | `exams/list.vue:79-94` |
| G21 | 评分规则编辑器 | `exams/list.vue:96-104` |
| G22 | is_active 开关 | `exams/list.vue:300-302` |
| G23 | 分数分布柱状图 | `scores/list.vue:158-172` |
| G24 | CSV 导出 | `scores/list.vue:59-80` |
| G26 | 树形 Checkbox 菜单 | `rbac/menus.vue:346-357` |
| G28 | RBAC 初始化按钮 | `rbac/menus.vue:181-192` |

### ❌ 仍低优先级未实现（6项）

| # | 页面 | 要求 | 原因 |
|---|------|------|------|
| G09 | questions | 材料题 parent_id + 子题列表 | 需后端/复杂UI |
| G17 | materials | meta JSON 编辑器 | 少数场景使用 |
| G25 | users | 查看详情 → 关联成绩 | 需新页面/路由 |
| G03 | question-types | 拖拽排序 | 需 sortablejs 依赖 |
| G27/G30 | rbac/kp | 拖拽排序 | 需 sortablejs 依赖 |
| G29 | knowledge-points | 知识点-题目关联 | 需后端/关联UI |

---

## 三、代码质量（4项已修复）

| # | 问题 | 修复内容 | 状态 |
|---|------|---------|------|
| C05 | users `handleResetPwdSubmit` 无 try/finally | 加 try/finally | ✅ 已修复 |
| C06 | `isBackendSuccess` 仅接受 200 | 改为 `=== 200 \|\| === 201` | ✅ 已修复 |
| C09 | Token 无刷新 | 需后端支持 refresh token endpoint | ⏸ 搁置 |
| C10 | `convertMenuToRoute` 不传 roles | 动态模式由后端控制菜单，roles 检查自然为空 | ✅ 设计如此 |

---

## 四、死代码

D06/D07 — 已确认存在但无害，保留供后续使用

---

## 五、安全

S03 (localStorage token XSS) / S04 (vercel 无 CSP) — 通用SPA问题

---

## 变更文件清单（2026-04-29）

| 文件 | 变更 |
|------|------|
| `src/plugins/ui.ts` | B07: 初始化 `window.$message/$messageBox/$notification` |
| `src/service/request/index.ts` | C06: `isBackendSuccess` 支持 code 201 |
| `src/service/api/questions.ts` | B03: 新增 `fetchQuestionDetail` |
| `src/views/users/list.vue` | C05: `handleResetPwdSubmit` 加 try/finally |
| `src/views/dashboard/index.vue` | G02: ECharts 柱状图 |
| `src/views/questions/list.vue` | B03+G05+G12+G14+G12 |
| `src/views/question-types/list.vue` | G04: 预设题型按钮 |
| `src/views/materials/list.vue` | G16+G19: 预览+卡片模式 |
| `docs/07-merged-issues.md` | 更新 |