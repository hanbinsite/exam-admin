# 02 — Feature Design

> 所有接口与 admin-api.md 对齐，Base URL: `/api/v1`

## Page 1: Login (`/login`)

### Data Interface

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'teacher';
}

interface LoginResponse {
  code: number;
  data: {
    token: string;
    admin: AdminInfo;
  };
  message: string;
}
```

### API

- `POST /admin/auth/login` — 登录
- `POST /admin/auth/register` — 注册新管理员（需 Admin JWT + `admin:manage`）

### UI

- 复用 SoybeanAdmin 内置登录页，改造为调用 `/admin/auth/login`
- 登录成功 → JWT 存 localStorage → 跳转 /dashboard
- 登录失败 → 显示错误提示（401: 邮箱或密码错误）

---

## Page 2: Dashboard (`/dashboard`)

### Data Interface

```typescript
interface DashboardData {
  total_users: number;
  total_submissions: number;
  active_subjects: number;
}
```

### API

- `GET /admin/dashboard` — 需 Admin JWT + `dashboard:view` 权限

### UI

- 3个统计卡片（注册学生数、考试提交数、激活科目数）
- 科目列表展示（各科目题目数/资料数/考试数）
- 最近成绩提交趋势图（ECharts）

---

## Page 3: Subject Management (`/subjects`)

### Data Interface

```typescript
interface Subject {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  stats?: {
    totalQuestions: number;
    totalMaterials: number;
    totalExams: number;
  };
}

interface SubjectCreateRequest {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
}

interface SubjectUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}
```

### API

- `GET /subjects` — 获取科目列表（无需认证）
- `GET /subjects/{subject_id}` — 获取科目详情
- `POST /subjects` — 创建科目（需 `subject:manage` + 科目授权）
- `PUT /subjects/{subject_id}` — 更新科目（需 `subject:manage` + 科目授权）
- `DELETE /subjects/{subject_id}` — 删除科目（需 `subject:manage` + 科目授权，有题目时返回 409）

### UI

- 科目列表表格（ID、名称、分类、状态、题目数、操作）
- 新增/编辑弹窗表单（ID仅创建时可填，name必填）
- 删除确认对话框（提示：有题目时无法删除）
- 状态开关（is_active）

---

## Page 4: Question Type Management (`/question-types`)

### Data Interface

```typescript
interface QuestionType {
  id: number;
  subject_id: string;
  name: string;
  display_name: string;
  has_options: boolean;
  has_sub_questions: boolean;
  scoring_type: 'auto' | 'mixed';
  default_score: number;
  sort_order: number;
}

interface QuestionTypeCreateRequest {
  subject_id: string;
  name: string;
  display_name: string;
  has_options?: boolean;
  has_sub_questions?: boolean;
  scoring_type?: 'auto' | 'mixed';
  default_score?: number;
  sort_order?: number;
}
```

### API

- `GET /subjects/{subject_id}/question-types` — 获取题型列表（无需认证）
- `POST /admin/question-types` — 创建题型（需 `question_type:manage`）
- `PUT /admin/question-types/{type_id}` — 更新题型（需 `question_type:manage`）
- `DELETE /admin/question-types/{type_id}` — 删除题型（需 `question_type:manage`，有题目时无法删除）

### UI

- 左侧科目选择器（切换科目后加载对应题型）
- 题型列表表格（显示名称、标识、默认分值、评分类型、排序）
- 新增/编辑弹窗表单
- 拖拽排序（sort_order）
- 预设5种题型：choice/multi_choice/judgment/fill_blank/material

---

## Page 5: Question Management (`/questions`)

### Data Interface

```typescript
interface Question {
  id: number;
  subject_id: string;
  type_id: number;
  parent_id?: number;
  title: string;
  content?: {
    options?: { key: string; text: string }[];
  };
  answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  category?: string;
  tags?: string[];
  sort_order?: number;
}

interface QuestionCreateRequest {
  subject_id: string;
  type_id: number;
  parent_id?: number;
  title: string;
  content?: object;
  answer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  score?: number;
  category?: string;
  tags?: string[];
  sort_order?: number;
}

interface QuestionStats {
  by_type: Record<string, number>;
  by_difficulty: Record<string, number>;
}

interface BatchImportResult {
  created: number;
  skipped: number;
}
```

### API

- `GET /subjects/{subject_id}/questions/stats` — 获取题目统计
- `POST /admin/questions` — 创建单道题目（需 `question:manage`）
- `PUT /admin/questions/{question_id}` — 更新题目（需 `question:manage`）
- `DELETE /admin/questions/{question_id}` — 删除题目（需 `question:manage`）
- `POST /admin/questions/batch` — 批量导入（需 `question:manage`）

### UI

- 顶部：科目选择器 + 题型统计卡片（各题型数量 + 难度分布饼图）
- 筛选栏：题型、难度、分类、关键词搜索
- 数据表格：ID、题型、题干（截断）、难度、分值、分类、操作
- 操作：查看详情、编辑、删除
- 新增按钮 → 弹窗表单（选项编辑器支持动态增删）
- 批量导入按钮 → JSON文件上传 / JSON文本粘贴
- 分页控件

### 选项编辑器

- 选择题：动态添加/删除选项（A/B/C/D...），设置正确答案
- 判断题：答案选择（对/错）
- 填空题：答案文本框
- 材料题：关联子题目

---

## Page 6: Material Management (`/materials`)

### Data Interface

```typescript
type MaterialType = 'guide' | 'practice_task' | 'case_analysis';

interface Material {
  id: number;
  subject_id: string;
  type: MaterialType;
  title: string;
  content: string;
  meta?: object;
  summary?: string;
  tags?: string[];
  sort_order: number;
}

interface MaterialCreateRequest {
  subject_id: string;
  type: MaterialType;
  title: string;
  content: string;
  meta?: object;
  summary?: string;
  tags?: string[];
  sort_order?: number;
}
```

### API

- `GET /subjects/{subject_id}/materials?type={type}` — 获取资料列表（需 User JWT）
- `GET /materials/{material_id}` — 获取资料详情
- `POST /admin/materials` — 创建资料（需 `material:manage`）
- `PUT /admin/materials/{material_id}` — 更新资料（需 `material:manage`）
- `DELETE /admin/materials/{material_id}` — 删除资料（需 `material:manage`）

### UI

- 左侧科目选择器 + 类型Tab切换（实操指南 / 实操任务 / 案例分析）
- 资料列表（卡片模式 + 列表模式切换）
- 新增/编辑弹窗（富文本编辑器编辑content，JSON编辑器编辑meta）
- 标签管理（tags数组编辑）
- 排序调整（sort_order）

---

## Page 7: Exam Config (`/exams`)

### Data Interface

```typescript
interface Exam {
  id: number;
  subject_id: string;
  name: string;
  description?: string;
  duration: number;
  question_rules: Record<string, { count: number; random?: boolean; fixed_ids?: number[] }>;
  scoring_rules: Record<string, { comparison: string; case_sensitive?: boolean }>;
  is_active: boolean;
}

interface ExamCreateRequest {
  subject_id: string;
  name: string;
  description?: string;
  duration?: number;
  question_rules: Record<string, { count: number; random?: boolean; fixed_ids?: number[] }>;
  scoring_rules: Record<string, { comparison: string; case_sensitive?: boolean }>;
}
```

### API

- `GET /subjects/{subject_id}/exams` — 获取考试列表（需 User JWT）
- `GET /exams/{exam_id}` — 获取考试详情（需 User JWT）
- `POST /admin/exams` — 创建考试（需 `exam:manage`）
- `PUT /admin/exams/{exam_id}` — 更新考试（需 `exam:manage`）

### UI

- 左侧科目选择器
- 考试列表表格（名称、时长、状态、操作）
- 新增/编辑弹窗：
  - 基本信息区：名称、描述、时长
  - 抽题规则区：按题型设置抽题数量 + 随机/固定
  - 评分规则区：按题型设置分值
- 启用/禁用开关（is_active）

### question_rules 编辑器

```
题型ID  抽取数量  模式        固定题目ID
[1]     [50]     [随机 ▼]    —
[3]     [20]     [随机 ▼]    —
[5]     [2]      [固定 ▼]    [101, 102]
```

---

## Page 8: Score Statistics (`/scores`)

### Data Interface

```typescript
interface ScoreStats {
  average_score: number;
  max_score: number;
  min_score: number;
  total_submissions: number;
  score_distribution: Record<string, number>;
}

interface ScoreItem {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  attempt_number: number;
  total_score: number;
  submitted_at: string;
}

interface ScoreListData {
  items: ScoreItem[];
  total: number;
  page: number;
  page_size: number;
}
```

### API

- `GET /admin/scores/stats?subjectId={subject_id}` — 科目成绩统计（需 `score:view`）
- `GET /admin/scores/list?subjectId={subject_id}&page=1&pageSize=20` — 成绩列表（需 `score:view`）

### UI

- 顶部科目选择器
- 统计概览卡片（平均分、最高分、最低分、提交总数）
- 分数分布柱状图（ECharts，按分数段 0-20/20-40/40-60/60-80/80-100）
- 成绩列表表格（学生姓名、邮箱、尝试次数、总分、提交时间）
- 分页控件
- CSV 导出按钮

---

## Page 9: User Management (`/users`)

### Data Interface

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface UserListData {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}
```

### API

- `GET /admin/users?page=1&pageSize=20` — 分页用户列表（需 `score:view`）

### UI

- 用户列表表格（ID、姓名、邮箱、注册时间）
- 分页控件
- 搜索框（按姓名/邮箱筛选，前端过滤）
- 查看详情 → 关联成绩

---

## Page 10: RBAC Management (`/rbac`)

### Data Interface

```typescript
interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
}

interface Role {
  id: number;
  code: string;
  name: string;
  is_super: boolean;
  is_active: boolean;
  sort_order: number;
  permissions?: Permission[];
}

interface Menu {
  id: number;
  name: string;
  routeKey?: string;
  path: string;
  meta: {
    title: string;
    i18nKey: string;
    icon: string;
    order: number;
    hideInMenu: boolean;
    href: string | null;
  };
  children?: Menu[];
}

interface AdminDetail {
  id: string;
  name: string;
  email: string;
  role: {
    code: string;
    name: string;
    is_super: boolean;
  };
  subjects: string[];
}
```

### API

**权限管理**（需 `admin:manage`）：
- `GET /admin/rbac/permissions` — 权限列表
- `POST /admin/rbac/permissions` — 创建权限
- `PUT /admin/rbac/permissions/{id}` — 更新权限
- `DELETE /admin/rbac/permissions/{id}` — 删除权限

**角色管理**（需 `admin:manage`）：
- `GET /admin/rbac/roles?includeInactive=true` — 角色列表
- `GET /admin/rbac/roles/{id}` — 角色详情（含权限列表）
- `POST /admin/rbac/roles` — 创建角色
- `PUT /admin/rbac/roles/{id}` — 更新角色
- `DELETE /admin/rbac/roles/{id}` — 删除角色（super_admin不可删）
- `GET /admin/rbac/roles/{code}/permissions` — 获取角色权限
- `POST /admin/rbac/roles/permissions` — 分配角色权限（全量覆盖）

**菜单管理**（需 `admin:manage`）：
- `GET /admin/rbac/menus` — 获取菜单树
- `POST /admin/rbac/menus` — 创建菜单
- `PUT /admin/rbac/menus/{id}` — 更新菜单
- `DELETE /admin/rbac/menus/{id}` — 删除菜单
- `GET /admin/rbac/roles/{code}/menus` — 获取角色菜单
- `POST /admin/rbac/roles/menus` — 分配角色菜单（全量覆盖）

**管理员管理**（需 `admin:manage`）：
- `GET /admin/rbac/admins` — 管理员列表
- `PUT /admin/rbac/admins/{id}/role` — 修改管理员角色
- `GET /admin/rbac/admins/{id}/menus` — 获取管理员菜单
- `GET /admin/rbac/admins/{id}/subjects` — 获取管理员授权科目

**科目授权**（需 `admin:manage`）：
- `POST /admin/rbac/subject-admins` — 分配管理员科目
- `DELETE /admin/rbac/subject-admins?adminId=&subjectId=` — 取消管理员科目授权

**用户科目授权**：
- `GET /admin/rbac/user-subjects/{user_id}` — 获取用户已授权科目
- `GET /admin/rbac/user-subjects/subject/{subject_id}` — 获取科目下已授权用户
- `POST /admin/rbac/user-subjects` — 分配用户科目
- `DELETE /admin/rbac/user-subjects?userId=&subjectId=` — 取消用户科目授权

### UI

#### 权限管理 Tab

- 权限列表表格（code、名称、描述）
- 新增/编辑权限弹窗
- 删除确认

#### 角色管理 Tab

- 角色列表（code、名称、是否超管、是否激活）
- 角色详情 → 权限分配（Checkbox多选，全量覆盖提交）
- 新增/编辑角色弹窗
- 菜单分配（树形Checkbox，全量覆盖提交）

#### 管理员管理 Tab

- 管理员列表（姓名、邮箱、角色、授权科目）
- 角色分配下拉框
- 科目授权管理（多选科目，增删）

#### 菜单管理 Tab

- 树形表格展示菜单层级（使用 `meta` 嵌套对象：title, i18nKey, icon, order, hideInMenu, href）
- 新增/编辑菜单弹窗（parent_name、name、path、meta各字段）

---

## Page 11: Admin Management (under `/rbac/admins`)

管理员管理作为 RBAC 管理的 Tab 之一，集成在 `/rbac` 页面的管理员 Tab 中。

### API

- `POST /admin/auth/register` — 注册新管理员（需 Admin JWT + `admin:manage`）

### UI

- 管理员列表（姓名、邮箱、角色、授权科目）
- 新增管理员弹窗（姓名、邮箱、密码）
- 注册成功后自动出现在管理员列表中
- 可紧接着分配角色 + 科目授权

---

## Page 12: Knowledge Points (`/knowledge-points`)

### Data Interface

```typescript
interface KnowledgePoint {
  id: number;
  subject_id: string;
  parent_id: number | null;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  children?: KnowledgePoint[];
}
```

### API

- `GET /admin/knowledge-points/subjects/{subject_id}` — 获取知识点树
- `GET /admin/knowledge-points/{id}` — 获取知识点详情
- `POST /admin/knowledge-points` — 创建知识点（需 `question:manage`）
- `PUT /admin/knowledge-points/{id}` — 更新知识点（需 `question:manage`）
- `DELETE /admin/knowledge-points/{id}` — 删除知识点（需 `question:manage`）
- `POST /admin/knowledge-points/assign` — 题目分配知识点
- `GET /admin/knowledge-points/questions/{question_id}` — 获取题目关联知识点

### UI

- 左侧科目选择器
- 树形表格展示知识点层级
- 新增/编辑弹窗（支持选择父知识点）
- 删除确认（子知识点需先删除）

---

## Page 13: User Center (`/user-center`)

### Data Interface

```typescript
interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  role_info: {
    code: string;
    name: string;
    is_super: boolean;
  };
}
```

### API

- `GET /admin/auth/me` — 获取当前管理员信息
- `PUT /admin/auth/me` — 修改个人信息（name, email）
- `PUT /admin/auth/password` — 修改密码

### UI

- 个人信息 Tab：姓名、邮箱编辑 + 角色显示（只读）
- 修改密码 Tab：当前密码 + 新密码 + 确认密码
- 不包含头像上传功能