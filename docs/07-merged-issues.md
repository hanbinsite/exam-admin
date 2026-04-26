# exam-admin 未完成事项 & Bug 合并清单

> 基于 docs/06-task-list-phase1.md 设计规格 vs 实际代码 + 深度代码分析合并整理
> 生成日期: 2026-04-26

---

## 一、紧急 Bug（影响功能正确性）

| # | 页面 | 问题 | 来源 | 严重度 |
|---|------|------|------|--------|
| B01 | question-types, questions, knowledge-points, materials, exams, scores | **onMounted 不加载初始数据**：当 `currentSubjectId` 已设置且 subjects 已缓存时，watcher 不触发，6个页面空白 | 代码分析 | 🔴 高 |
| B02 | 所有 CRUD 页面 | **表单验证失效**：仅 `required` 星号，无 `:rules` + `validate()`，空表单可提交 | 代码分析 | 🔴 高 |
| B03 | questions/list.vue | **编辑丢失 content/explanation/tags**：列表 API 不返回这些字段，编辑表单直接覆盖为空值 | 代码分析 | 🔴 高 |
| B04 | materials/list.vue | **分页组件缺失**：有 pagination 数据但模板无 `<ElPagination>`，无法翻页 | 代码分析 | 🔴 高 |
| B05 | rbac/roles.vue | **`handleEdit` 硬编码 `description=''`**：编辑角色时描述被清空 | 代码分析 | 🔴 高 |
| B06 | subjects/list.vue | **`icon` 字段编辑时不保存**：`fetchUpdateSubject` 只发 name/description/category，遗漏 icon | 代码分析+设计差距 | 🔴 高 |
| B07 | service/request/index.ts | **`onBackendFail` 非成功码静默吞错误**：非 401 的后端错误无任何用户提示 | 代码分析 | 🟠 中 |
| B08 | rbac/admins.vue | **角色切换无确认弹窗**：inline ElSelect 点错即改，`is_super` 开关无保护 | 代码分析 | 🟠 中 |
| B09 | knowledge-points/list.vue | **父级选择器含自身**：可创建循环引用导致树结构崩溃 | 代码分析 | 🟠 中 |
| B10 | rbac/menus.vue | **父级选择器含自身**：同 B09，菜单树可循环引用 | 代码分析 | 🟠 中 |

---

## 二、设计规格未实现项（docs/02-feature-design.md 要求但未做）

### Dashboard（2项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G01 | 科目列表（各科目显示题目数/资料数/考试数） | 仅 3 个数字卡片，无科目列表 | P1 |
| G02 | 最近成绩提交趋势图（ECharts 折线/柱状图） | 无任何图表 | P1 |

### Question Types（2项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G03 | 拖拽排序 sort_order | 仅数字输入框 | P2 |
| G04 | 预设5种题型初始化按钮（choice/multi_choice/judgment/fill_blank/material） | 无 | P2 |

### Questions（11项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G05 | 难度分布饼图（ECharts） | 仅数字统计卡片 | P2 |
| G06 | **选项编辑器**（选择题动态增删 A/B/C/D + 设置正确答案） | 仅一个 answer 文本框 | 🔴 P0 |
| G07 | 判断题专用 true/false 选择器 | 通用文本框 | P1 |
| G08 | 填空题专用答案文本框 | 通用文本框 | P1 |
| G09 | 材料题关联子题目（parent_id + 子题列表） | 无 | P2 |
| G10 | content.options 编辑 UI | `form.content = {}` 从未编辑 | 🔴 P0 |
| G11 | 标签编辑 UI（tags 数组增删） | `form.tags = []` 从未绑定 | P1 |
| G12 | 分类筛选下拉框 | API 支持但 UI 无此筛选项 | P2 |
| G13 | JSON 文件上传（批量导入） | 仅支持文本粘贴，无文件上传 | P2 |
| G14 | 查看详情（只读视图） | 仅编辑和删除，无只读查看 | P1 |
| G15 | explanation 字段编辑时未回填（列表不含此字段） | 合并到 B03 | — |

### Materials（4项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G16 | **富文本编辑器编辑 content** | 纯 textarea | P1 |
| G17 | JSON 编辑器编辑 meta | 无 meta 编辑 UI | P2 |
| G18 | 标签编辑 UI | 无 tags 编辑 UI | P1 |
| G19 | 卡片+列表模式切换 | 仅表格模式 | P2 |

### Exams（3项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G20 | **结构化抽题规则编辑器**（按题型行：type_id/数量/模式/固定ID） | 原始 JSON textarea | 🔴 P0 |
| G21 | **结构化评分规则编辑器**（按题型行：type_id/分值） | 原始 JSON textarea | 🔴 P0 |
| G22 | 创建/编辑弹窗含 is_active 开关 | 仅表格内开关 | P2 |

### Scores（2项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G23 | **分数分布柱状图**（ECharts，0-20/20-40/40-60/60-80/80-100） | 数据已获取但未渲染 | P1 |
| G24 | CSV 导出按钮 | 无导出功能 | P1 |

### Users（1项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G25 | 查看详情 → 关联成绩 | 无用户详情页 | P2 |

### RBAC（3项）

| # | 设计要求 | 当前状态 | 优先级 |
|---|---------|---------|--------|
| G26 | **树形 Checkbox 菜单分配**（保留层级关系） | 扁平 CheckboxGroup 列表 | P1 |
| G27 | 菜单拖拽排序 | 仅数字输入框 | P2 |
| G28 | RBAC 初始化按钮（调 fetchRbacInit） | API 存在但无 UI | P2 |

### Knowledge Points（超越规格但有 API 支持，2项）

| # | 功能 | 当前状态 | 优先级 |
|---|------|---------|--------|
| G29 | 知识点-题目关联 UI（fetchAssignKnowledgePoints API 存在） | 无 UI | P2 |
| G30 | 拖拽排序 | 仅数字输入框 | P2 |

**设计差距合计：30项**

---

## 三、代码质量问题（非 Bug 但需改进）

| # | 问题 | 影响 | 优先级 |
|---|------|------|--------|
| C01 | `useAuth` hook 完全失效（buttons 数组永远为空），且无页面调用 | 前端权限形同虚设 | P1 |
| C02 | Auth Store `userInfo` 添加了 `buttons: []` 但类型定义无此字段 | TS 违规 | P1 |
| C03 | `loginByToken` 未获取 AdminProfile（缺少 `role_info.is_super`） | 动态模式无法判断超管 | P1 |
| C04 | Exam Store ID 不在 SetupStoreId 枚举（`$reset()` 不可用） | Store 重置失败 | P2 |
| C05 | 所有页面 `submitting` 标志未用 `try/finally`，异常时按钮卡死 | 边界情况卡 UI | P2 |
| C06 | `isBackendSuccess` 接受 code 201 但 API 文档只有 200 | 可能掩盖异常 | P2 |
| C07 | 401 返回 `{ data: null, error: null }` 模糊状态 | 调用方无法正确判断 | P2 |
| C08 | 登出不清除 `currentSubjectId`，换账号残留旧科目 | 数据错乱 | P2 |
| C09 | Token 无刷新机制，7天过期后强制登出 | UX 差 | P2 |
| C10 | 动态路由 `convertMenuToRoute` 不传 `roles`，guard 角色检查永远通过 | 权限绕过风险 | P2 |
| C11 | exams/list.vue 删除提示"无法恢复"但实际是软删除 | 提示误导 | P3 |
| C12 | users/list.vue 激活无确认弹窗（停用有确认，不对称） | UX 不一致 | P3 |
| C13 | user-center 角色显示原始 code 而非名称 | UX 差 | P3 |
| C14 | scores `submitted_at` 显示原始 ISO 字符串，未格式化 | UX 差 | P3 |

---

## 四、死代码 / 依赖清理

| # | 项目 | 说明 |
|---|------|------|
| D01 | `src/service-alova/` | SoybeanAdmin 残留，未使用 |
| D02 | `src/typings/api/auth.d.ts, common.d.ts, system-manage.d.ts` | 旧 `Api.*` 命名空间，业务已用 `Exam.*` |
| D03 | `src/hooks/business/captcha.ts` | 模拟验证码，exam 不用 |
| D04 | `src/constants/business.ts` | 引用旧 `Api.*` 类型 |
| D05 | ~20个未使用依赖 | @antv/g2, wangeditor, xlsx, swiper, vditor, vue-pdf-embed, dhtmlx-gantt, xgplayer 等，显著增大 bundle |
| D06 | 13个已定义但未调用的 API 函数 | fetchRbacInit, fetchRbacAdminMenus, fetchAdminExamDetail, fetchQuestionKnowledgePoints, fetchAssignKnowledgePoints, fetchUserSubjects, fetchSubjectUsers, fetchAssignUserSubject, fetchRemoveUserSubject, fetchSubjectById, fetchUserById, fetchRoleById, fetchAssignUserSubject |
| D07 | `PERMISSION_CODES`, `QUESTION_TYPE_NAMES` 等常量已定义但未引用 | 代码冗余 |
| D08 | `Exam.Subject.SubjectStats` camelCase/snake_case 可能不匹配 | 需后端确认 |
| D09 | `SubjectUpdateRequest` 类型缺 `icon` 字段 | 合并到 B06 |

---

## 五、安全问题

| # | 问题 | 优先级 |
|---|------|--------|
| S01 | 前端无权限检查，所有页面依赖后端 403 | P1 |
| S02 | admins.vue `is_super` 开关无确认，一键可提权 | P1 |
| S03 | Token 存 localStorage，XSS 可窃取 | P2 |
| S04 | vercel.json 无 CSP/安全头 | P2 |

---

## 六、合并统计 & 优先级建议

| 类别 | 数量 | P0(必须修) | P1(应该修) | P2(可以修) | P3(锦上添花) |
|------|------|-----------|-----------|-----------|-------------|
| 紧急 Bug (B) | 10 | 6 | 4 | 0 | 0 |
| 设计差距 (G) | 30 | 3 | 9 | 15 | 3 |
| 代码质量 (C) | 14 | 0 | 3 | 8 | 3 |
| 死代码 (D) | 9 | 0 | 2 | 7 | 0 |
| 安全 (S) | 4 | 0 | 2 | 2 | 0 |
| **合计** | **67** | **9** | **20** | **32** | **6** |

### P0 修复顺序（建议）

1. **B01** — 6个页面 onMounted 加载初始数据（影响最大、修最简单）
2. **B02** — 所有表单补充 `:rules` + `validate()`
3. **B03** — questions 编辑时调详情 API 获取完整数据
4. **B04** — materials 补充分页组件
5. **B05** — roles.vue handleEdit 保留 description
6. **B06** — subjects 更新含 icon + 类型定义补 icon
7. **G06** — questions 选项编辑器（核心功能）
8. **G10** — questions content.options 编辑
9. **G20+G21** — exams 结构化规则编辑器

---

## 七、06-task-list-phase1.md 完成度映射

| Task | 描述 | 完成度 | 遗留问题 |
|------|------|--------|---------|
| T001 | Clone Template | ✅ 100% | — |
| T002 | API Client + Axios | ✅ 90% | B07/B08 (错误处理) |
| T003 | Auth Store 改造 | ✅ 85% | C02/C03/C08/C09 |
| T004 | Login Page 改造 | ✅ 100% | — |
| T005 | API Modules | ✅ 100% | 13个函数未使用 (D06) |
| T006 | 类型定义 | ✅ 90% | content/meta 用 object 太宽泛，icon 缺失 |
| T007 | Dashboard | ⚠️ 40% | G01/G02 未做 |
| T008 | Subject Management | ⚠️ 90% | B06 (icon 不保存) |
| T009 | Question Type Management | ⚠️ 80% | G03/G04 未做 |
| T010 | Question List & Stats | ⚠️ 70% | G05/B01 (加载) |
| T011 | Question Form & CRUD | ❌ 30% | G06-G11/B03 (编辑器/验证/数据丢失) |
| T012 | Question Batch Import | ⚠️ 70% | G13 (文件上传) |
| T013 | Material Management | ⚠️ 60% | G16-G19/B04 (分页/编辑器) |
| T014 | Exam Config | ⚠️ 50% | G20-G22 (规则编辑器) |
| T015 | Score Statistics | ⚠️ 60% | G23/G24 (图表/导出) |
| T016 | User Management | ⚠️ 80% | G25 (详情) |
| T017 | RBAC Permissions | ✅ 95% | B02 (验证) |
| T018 | RBAC Roles | ⚠️ 85% | B05 (description 清空), G26 |
| T019 | RBAC Admins | ⚠️ 85% | B08 (角色切换无确认) |
| T020 | RBAC Menus | ⚠️ 75% | G26/G27/B10 (树形/排序/循环) |
| T021 | 路由配置 | ✅ 100% | — |
| T022 | 权限控制集成 | ⚠️ 50% | C01/C10 (useAuth 失效, roles 不传) |
| T023 | Vercel 部署 | ✅ 100% | S04 (无安全头) |

**整体完成度: ~72%**
