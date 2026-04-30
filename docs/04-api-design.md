# 04 — API Client Design

> 与 admin-api.md 完全对齐，Base URL: `https://exam-server.hanbin123.com/api/v1`

## Base Client (`src/service/request/index.ts`)

使用 `@sa/axios` 的 `createFlatRequest` 创建请求实例，`transform` 自动提取 `response.data.data`，业务代码直接拿到解包后的数据。

```typescript
import { createFlatRequest } from '@sa/axios';
import { localStg } from '@/utils/storage';

export const request = createFlatRequest(
  {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {}
  },
  {
    // 自动提取 response.data.data
    transform(response) {
      return response.data.data;
    },
    // 请求拦截：自动附加 Admin JWT
    async onRequest(config) {
      const token = localStg.get('token');
      if (token) {
        Object.assign(config.headers, { Authorization: `Bearer ${token}` });
      }
      return config;
    },
    // 判断业务是否成功
    isBackendSuccess(response) {
      return response.data.code === 200 || response.data.code === 201;
    },
    // 业务失败处理
    async onBackendFail(response) {
      // 特定code自动登出
      // 其他错误 showErrorMsg 提示
    },
    // 网络错误处理
    onError(error) {
      showErrorMsg(request.state, error.message);
    }
  }
);
```

**使用模式**（所有 API 模块统一使用）：

```typescript
// 正确写法：返回值已由 transform 自动解包
const { data, error } = await request<T>({ url: '/path', method: 'get', params });

// data 类型为 T | null，error 为错误信息
if (!error && data) { /* 使用 data */ }
```

---

## API Modules

所有模块位于 `src/service/api/`，统一采用 `request<T>()` 模式。

### `src/service/api/auth.ts`

```typescript
import { request } from '../request';

export function fetchAdminLogin(email: string, password: string) {
  return request<Exam.Auth.LoginToken>({
    url: '/admin/auth/login',
    method: 'post',
    data: { email, password }
  });
}

export function fetchAdminRegister(name: string, email: string, password: string) {
  return request<Exam.Auth.LoginToken>({
    url: '/admin/auth/register',
    method: 'post',
    data: { name, email, password }
  });
}

export function fetchAdminMe() {
  return request<Exam.Auth.AdminProfile>({
    url: '/admin/auth/me'
  });
}

export function fetchAdminPermissions() {
  return request<string[]>({
    url: '/admin/auth/permissions'
  });
}

export function fetchUpdateAdminMe(data: { name?: string; email?: string }) {
  return request<Exam.Auth.AdminProfile>({
    url: '/admin/auth/me',
    method: 'put',
    data
  });
}

export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return request<{ message: string }>({
    url: '/admin/auth/password',
    method: 'put',
    data: { old_password: oldPassword, new_password: newPassword }
  });
}

export function fetchAdminLogout() {
  return request<null>({
    url: '/admin/auth/logout',
    method: 'post'
  });
}
```

---

### `src/service/api/dashboard.ts`

```typescript
import { request } from '../request';

export function fetchDashboard() {
  return request<Exam.Dashboard.DashboardData>({
    url: '/admin/dashboard'
  });
}
```

---

### `src/service/api/subjects.ts`

```typescript
import { request } from '../request';

// 返回分页数据
export function fetchSubjectList(page?: number, pageSize?: number) {
  return request<Exam.Subject.SubjectListData>({
    url: '/subjects',
    params: page !== undefined && pageSize !== undefined ? { page, pageSize } : undefined
  });
}

export function fetchSubjectById(subjectId: string) {
  return request<Exam.Subject.Subject>({
    url: `/subjects/${subjectId}`
  });
}

export function fetchCreateSubject(data: Exam.Subject.SubjectCreateRequest) {
  return request<Exam.Subject.Subject>({
    url: '/admin/subjects',
    method: 'post',
    data
  });
}

export function fetchUpdateSubject(subjectId: string, data: Exam.Subject.SubjectUpdateRequest) {
  return request<Exam.Subject.Subject>({
    url: `/admin/subjects/${subjectId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteSubject(subjectId: string) {
  return request<null>({
    url: `/admin/subjects/${subjectId}`,
    method: 'delete'
  });
}
```

---

### `src/service/api/question-types.ts`

```typescript
import { request } from '../request';

export function fetchQuestionTypeList(subjectId: string) {
  return request<Exam.QuestionType.QuestionType[]>({
    url: `/subjects/${subjectId}/question-types`
  });
}

export function fetchCreateQuestionType(data: Exam.QuestionType.QuestionTypeCreateRequest) {
  return request<Exam.QuestionType.QuestionType>({
    url: '/admin/question-types',
    method: 'post',
    data
  });
}

export function fetchUpdateQuestionType(typeId: number, data: Partial<Exam.QuestionType.QuestionTypeCreateRequest>) {
  return request<Exam.QuestionType.QuestionType>({
    url: `/admin/question-types/${typeId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteQuestionType(typeId: number) {
  return request<null>({
    url: `/admin/question-types/${typeId}`,
    method: 'delete'
  });
}
```

---

### `src/service/api/questions.ts`

```typescript
import { request } from '../request';

export function fetchQuestionList(subjectId: string, params: Exam.Question.QuestionListParams) {
  return request<Exam.Question.QuestionListData>({
    url: `/admin/subjects/${subjectId}/questions`,
    params
  });
}

export function fetchQuestionStats(subjectId: string) {
  return request<Exam.Question.QuestionStats>({
    url: `/subjects/${subjectId}/questions/stats`
  });
}

export function fetchCreateQuestion(data: Exam.Question.QuestionCreateRequest) {
  return request<{ id: number }>({
    url: '/admin/questions',
    method: 'post',
    data
  });
}

export function fetchUpdateQuestion(questionId: number, data: Partial<Exam.Question.QuestionCreateRequest>) {
  return request<{ id: number }>({
    url: `/admin/questions/${questionId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteQuestion(questionId: number) {
  return request<null>({
    url: `/admin/questions/${questionId}`,
    method: 'delete'
  });
}

export function fetchBatchImportQuestions(subjectId: string, questions: Exam.Question.QuestionCreateRequest[]) {
  return request<Exam.Question.BatchImportResult>({
    url: '/admin/questions/batch',
    method: 'post',
    data: { subject_id: subjectId, questions }
  });
}
```

---

### `src/service/api/materials.ts`

```typescript
import { request } from '../request';

// 返回分页数据
export function fetchMaterialList(subjectId: string, params?: { page?: number; pageSize?: number; type?: string }) {
  return request<Exam.Material.MaterialListData>({
    url: `/admin/subjects/${subjectId}/materials`,
    params
  });
}

export function fetchCreateMaterial(data: Exam.Material.MaterialCreateRequest) {
  return request<Exam.Material.Material>({
    url: '/admin/materials',
    method: 'post',
    data
  });
}

export function fetchUpdateMaterial(materialId: number, data: Partial<Exam.Material.MaterialCreateRequest>) {
  return request<Exam.Material.Material>({
    url: `/admin/materials/${materialId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteMaterial(materialId: number) {
  return request<null>({
    url: `/admin/materials/${materialId}`,
    method: 'delete'
  });
}
```

---

### `src/service/api/exams.ts`

```typescript
import { request } from '../request';

export function fetchExamList(subjectId: string) {
  return request<Exam.ExamModule.ExamConfig[]>({
    url: `/subjects/${subjectId}/exams`
  });
}

export function fetchExamById(examId: number) {
  return request<Exam.ExamModule.ExamConfig>({
    url: `/exams/${examId}`
  });
}

export function fetchCreateExam(data: Exam.ExamModule.ExamCreateRequest) {
  return request<{ id: number; name: string }>({
    url: '/admin/exams',
    method: 'post',
    data
  });
}

export function fetchUpdateExam(examId: number, data: Partial<Exam.ExamModule.ExamCreateRequest>) {
  return request<{ id: number; name: string }>({
    url: `/admin/exams/${examId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteExam(examId: number) {
  return request<null>({
    url: `/admin/exams/${examId}`,
    method: 'delete'
  });
}

export function fetchExamSessionList(examId: number, page?: number, pageSize?: number) {
  return request<Exam.ExamSession.ExamSessionListData>({
    url: `/admin/exams/${examId}/sessions`,
    params: { page, pageSize }
  });
}

export function fetchExamSessionById(sessionId: number) {
  return request<Exam.ExamSession.ExamSessionDetail>({
    url: `/admin/exams/sessions/${sessionId}`
  });
}
```

---

### `src/service/api/scores.ts`

```typescript
import { request } from '../request';

export function fetchScoreStats(subjectId: string) {
  return request<Exam.Score.ScoreStats>({
    url: '/admin/scores/stats',
    params: { subjectId }
  });
}

export function fetchScoreList(subjectId: string, page?: number, pageSize?: number) {
  return request<Exam.Score.ScoreListData>({
    url: '/admin/scores/list',
    params: { subjectId, page, pageSize }
  });
}
```

---

### `src/service/api/users.ts`

```typescript
import { request } from '../request';

export function fetchUserList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request<Exam.User.UserListData>({
    url: '/admin/users',
    params
  });
}

export function fetchUserDetail(userId: string) {
  return request<Exam.User.UserDetail>({
    url: `/admin/users/${userId}`
  });
}

export function fetchCreateUser(data: { name: string; email: string; password: string; phone?: string }) {
  return request<Exam.User.User>({
    url: '/admin/users',
    method: 'post',
    data
  });
}

export function fetchActivateUser(userId: string) {
  return request<{ id: string; is_active: boolean }>({
    url: `/admin/users/${userId}/activate`,
    method: 'put'
  });
}

export function fetchResetUserPassword(userId: string, newPassword: string) {
  return request<{ message: string }>({
    url: `/admin/users/${userId}/reset-password`,
    method: 'put',
    data: { new_password: newPassword }
  });
}

export function fetchDeactivateUser(userId: string) {
  return request<{ id: string; deleted: boolean }>({
    url: `/admin/users/${userId}`,
    method: 'delete'
  });
}
```

---

### `src/service/api/knowledge-points.ts`

```typescript
import { request } from '../request';

export function fetchKnowledgePointTree(subjectId: string) {
  return request<Exam.KnowledgePoint.KnowledgePoint[]>({
    url: `/admin/knowledge-points/subjects/${subjectId}`
  });
}

export function fetchKnowledgePointById(id: number) {
  return request<Exam.KnowledgePoint.KnowledgePoint>({
    url: `/admin/knowledge-points/${id}`
  });
}

export function fetchCreateKnowledgePoint(data: Exam.KnowledgePoint.KnowledgePointCreateRequest) {
  return request<Exam.KnowledgePoint.KnowledgePoint>({
    url: '/admin/knowledge-points',
    method: 'post',
    data
  });
}

export function fetchUpdateKnowledgePoint(id: number, data: Partial<Exam.KnowledgePoint.KnowledgePointCreateRequest>) {
  return request<Exam.KnowledgePoint.KnowledgePoint>({
    url: `/admin/knowledge-points/${id}`,
    method: 'put',
    data
  });
}

export function fetchDeleteKnowledgePoint(id: number) {
  return request<null>({
    url: `/admin/knowledge-points/${id}`,
    method: 'delete'
  });
}
```

---

### `src/service/api/rbac.ts`

```typescript
import { request } from '../request';

// 权限管理
export function fetchPermissionList() {
  return request<Exam.RBAC.Permission[]>({
    url: '/admin/rbac/permissions'
  });
}

// 角色管理
export function fetchRoleList() {
  return request<Exam.RBAC.Role[]>({
    url: '/admin/rbac/roles'
  });
}

export function fetchRolePermissions(roleCode: string) {
  return request<Exam.RBAC.Permission[]>({
    url: `/admin/rbac/roles/${roleCode}/permissions`
  });
}

// 菜单管理
export function fetchMenuList() {
  return request<Exam.RBAC.Menu[]>({
    url: '/admin/rbac/menus'
  });
}

// 管理员管理
export function fetchAdminList() {
  return request<Exam.RBAC.AdminDetail[]>({
    url: '/admin/rbac/admins'
  });
}

export function fetchUpdateAdminRole(adminId: string, roleCode: string) {
  return request<null>({
    url: `/admin/rbac/admins/${adminId}/role`,
    method: 'put',
    data: { role_code: roleCode }
  });
}

export function fetchAdminSubjects(adminId: string) {
  return request<string[]>({
    url: `/admin/rbac/admins/${adminId}/subjects`
  });
}

// RBAC 初始化
export function fetchRbacInit() {
  return request<Exam.RBAC.RbacInitResult>({
    url: '/admin/rbac/init',
    method: 'post'
  });
}
```

---

## 类型定义体系

类型定义位于 `src/typings/api/exam.d.ts`，使用 `declare namespace Exam` 命名空间组织：

```
Exam.Auth.{AdminInfo, AdminProfile, LoginToken, MenuItem, ...}
Exam.Subject.{Subject, SubjectListData, SubjectCreateRequest, ...}
Exam.Question.{Question, QuestionListItem, QuestionListData, ...}
Exam.Material.{Material, MaterialListData, MaterialCreateRequest, ...}
Exam.ExamModule.{ExamConfig, ExamCreateRequest, QuestionRule}
Exam.ExamSession.{ExamSessionItem, ExamSessionDetail, ExamSessionListData}
Exam.Score.{ScoreStats, ScoreItem, ScoreListData}
Exam.User.{User, UserDetail, UserListData}
Exam.RBAC.{Permission, Role, Menu, AdminDetail, RbacInitResult}
Exam.KnowledgePoint.{KnowledgePoint, KnowledgePointCreateRequest, ...}
```

### 分页返回结构

所有列表接口统一返回分页结构：

```typescript
interface PaginatedData<T> {
  items: T[];     // 数据列表
  total: number;  // 总条数
  page: number;   // 当前页
  page_size: number; // 每页条数
}
```

### 组件中使用模式

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { fetchSubjectList } from '@/service/api';

const data = ref<Exam.Subject.Subject[]>([]);
const loading = ref(false);

async function loadData() {
  loading.value = true;
  const { data: result, error } = await fetchSubjectList(1, 20);
  if (!error && result) {
    data.value = result.items;
  }
  loading.value = false;
}
</script>
```

---

## Error Handling

`createFlatRequest` 内置错误处理机制：

| 场景 | 处理方式 |
|------|----------|
| 401 未登录 | `onBackendFail` 检测 logout codes，清除 token，重定向登录页 |
| 403 权限不足 | 后端返回错误 message，`showErrorMsg` 弹窗提示 |
| 404 不存在 | 后端返回错误 message，`showErrorMsg` 弹窗提示 |
| 409 冲突 | 后端返回具体冲突原因（如"科目下有题目，无法删除"） |
| 网络超时 | `onError` 捕获，`showErrorMsg` 提示 |
| 服务器休眠 | Loading 态 + "正在连接服务器..." |

业务代码中通过 `const { data, error } = await request<T>(...)` 解构，检查 `error` 判断是否成功。
