# 04 — API Client Design

> 与 admin-api.md 完全对齐，Base URL: `https://exam-server.hanbin123.com/api/v1`

## Base Client (`src/api/client.ts`)

```typescript
import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://exam-server.hanbin123.com/api/v1';

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 Admin JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理统一响应格式 + 错误处理
client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const { code, message } = response.data;
    if (code === 200 || code === 201) {
      return response;
    }
    // 业务错误
    return Promise.reject(new Error(message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    if (error.response?.status === 403) {
      return Promise.reject(new Error('权限不足'));
    }
    if (error.response?.status === 404) {
      return Promise.reject(new Error('资源不存在'));
    }
    if (error.response?.status === 409) {
      return Promise.reject(new Error(error.response.data?.message || '操作冲突'));
    }
    return Promise.reject(new Error('网络请求失败'));
  }
);

export const api = {
  get: <T>(url: string, params?: object) => client.get<ApiResponse<T>>(url, { params }),
  post: <T>(url: string, data?: object) => client.post<ApiResponse<T>>(url, data),
  put: <T>(url: string, data?: object) => client.put<ApiResponse<T>>(url, data),
  delete: <T>(url: string, params?: object) => client.delete<ApiResponse<T>>(url, { params }),
};

export default client;
```

---

## API Modules

### `src/api/exam-server/auth.ts`

```typescript
import { api } from '../client';
import type { AdminInfo, LoginResponse } from '@/typings/business';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/admin/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post<LoginResponse>('/admin/auth/register', { name, email, password }),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<{ message: string }>('/admin/auth/password', { old_password: oldPassword, new_password: newPassword }),
};
```

---

### `src/api/exam-server/dashboard.ts`

```typescript
import { api } from '../client';

interface DashboardData {
  total_users: number;
  total_submissions: number;
  active_subjects: number;
}

export const dashboardApi = {
  getOverview: () => api.get<DashboardData>('/admin/dashboard'),
};
```

---

### `src/api/exam-server/subjects.ts`

```typescript
import { api } from '../client';
import type { Subject, SubjectCreateRequest, SubjectUpdateRequest } from '@/typings/business';

interface SubjectStats {
  totalQuestions: number;
  totalMaterials: number;
  totalExams: number;
}

interface SubjectWithStats extends Subject {
  stats?: SubjectStats;
}

export const subjectsApi = {
  list: () => api.get<SubjectWithStats[]>('/subjects'),
  
  getById: (subjectId: string) => api.get<Subject>(`/subjects/${subjectId}`),
  
  create: (data: SubjectCreateRequest) => api.post<Subject>('/subjects', data),
  
  update: (subjectId: string, data: SubjectUpdateRequest) =>
    api.put<Subject>(`/subjects/${subjectId}`, data),
  
  delete: (subjectId: string) => api.delete<null>(`/subjects/${subjectId}`),
};
```

---

### `src/api/exam-server/question-types.ts`

```typescript
import { api } from '../client';
import type { QuestionType, QuestionTypeCreateRequest } from '@/typings/business';

export const questionTypesApi = {
  list: (subjectId: string) =>
    api.get<QuestionType[]>(`/subjects/${subjectId}/question-types`),
  
  create: (data: QuestionTypeCreateRequest) =>
    api.post<QuestionType>('/admin/question-types', data),
  
  update: (typeId: number, data: Partial<QuestionTypeCreateRequest>) =>
    api.put<QuestionType>(`/admin/question-types/${typeId}`, data),
  
  delete: (typeId: number) =>
    api.delete<null>(`/admin/question-types/${typeId}`),
};
```

---

### `src/api/exam-server/questions.ts`

```typescript
import { api } from '../client';
import type { Question, QuestionCreateRequest, QuestionStats, QuestionListData, QuestionListParams } from '@/typings/business';

interface BatchImportResult {
  created: number;
  skipped: number;
}

export const questionsApi = {
  list: (subjectId: string, params: QuestionListParams) =>
    api.get<QuestionListData>(`/admin/subjects/${subjectId}/questions`, params),
  
  stats: (subjectId: string) =>
    api.get<QuestionStats>(`/subjects/${subjectId}/questions/stats`),
  
  create: (data: QuestionCreateRequest) =>
    api.post<Question>('/admin/questions', data),
  
  update: (questionId: number, data: Partial<QuestionCreateRequest>) =>
    api.put<Question>(`/admin/questions/${questionId}`, data),
  
  delete: (questionId: number) =>
    api.delete<null>(`/admin/questions/${questionId}`),
  
  batchImport: (questions: QuestionCreateRequest[]) =>
    api.post<BatchImportResult>('/admin/questions/batch', questions),
};
```

---

### `src/api/exam-server/materials.ts`

```typescript
import { api } from '../client';
import type { Material, MaterialCreateRequest, MaterialType } from '@/typings/business';

export const materialsApi = {
  list: (subjectId: string, type?: MaterialType) =>
    api.get<Material[]>(`/subjects/${subjectId}/materials`, type ? { type } : undefined),
  
  getById: (materialId: number) =>
    api.get<Material>(`/materials/${materialId}`),
  
  create: (data: MaterialCreateRequest) =>
    api.post<Material>('/admin/materials', data),
  
  update: (materialId: number, data: Partial<MaterialCreateRequest>) =>
    api.put<Material>(`/admin/materials/${materialId}`, data),
  
  delete: (materialId: number) =>
    api.delete<null>(`/admin/materials/${materialId}`),
};
```

---

### `src/api/exam-server/exams.ts`

```typescript
import { api } from '../client';
import type { Exam, ExamCreateRequest } from '@/typings/business';

export const examsApi = {
  list: (subjectId: string) =>
    api.get<Exam[]>(`/subjects/${subjectId}/exams`),
  
  getById: (examId: number) =>
    api.get<Exam>(`/exams/${examId}`),
  
  create: (data: ExamCreateRequest) =>
    api.post<Exam>('/admin/exams', data),
  
  update: (examId: number, data: Partial<ExamCreateRequest>) =>
    api.put<Exam>(`/admin/exams/${examId}`, data),
  
  delete: (examId: number) =>
    api.delete<{ id: number }>(`/admin/exams/${examId}`),
};
```

---

### `src/api/exam-server/scores.ts`

```typescript
import { api } from '../client';
import type { ScoreStats, ScoreItem } from '@/typings/business';

interface ScoreListData {
  items: ScoreItem[];
  total: number;
  page: number;
  page_size: number;
}

export const scoresApi = {
  stats: (subjectId: string) =>
    api.get<ScoreStats>('/admin/scores/stats', { subjectId }),
  
  list: (subjectId: string, page: number = 1, pageSize: number = 20) =>
    api.get<ScoreListData>('/admin/scores/list', { subjectId, page, pageSize }),
};
```

---

### `src/api/exam-server/users.ts`

```typescript
import { api } from '../client';
import type { User } from '@/typings/business';

interface UserListData {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export const usersApi = {
  list: (page: number = 1, pageSize: number = 20) =>
    api.get<UserListData>('/admin/users', { page, pageSize }),
  
  resetPassword: (userId: string, newPassword: string) =>
    api.put<{ message: string }>(`/admin/users/${userId}/reset-password`, { user_id: userId, new_password: newPassword }),
};
```

---

### `src/api/exam-server/rbac.ts`

```typescript
import { api } from '../client';
import type { Permission, Role, Menu, AdminDetail } from '@/typings/business';

interface RbacInitResult {
  permissions_created: number;
  roles_created: number;
}

export const rbacApi = {
  init: () => api.post<RbacInitResult>('/admin/rbac/init'),
  
  // Permission CRUD
  listPermissions: () => api.get<Permission[]>('/admin/rbac/permissions'),
  createPermission: (data: { code: string; name: string; description?: string }) =>
    api.post<Permission>('/admin/rbac/permissions', data),
  updatePermission: (id: number, data: Partial<Permission>) =>
    api.put<Permission>(`/admin/rbac/permissions/${id}`, data),
  deletePermission: (id: number) =>
    api.delete<null>(`/admin/rbac/permissions/${id}`),
  
  // Role CRUD
  listRoles: (includeInactive?: boolean) =>
    api.get<Role[]>('/admin/rbac/roles', includeInactive ? { includeInactive: true } : undefined),
  getRole: (roleId: number) => api.get<Role>(`/admin/rbac/roles/${roleId}`),
  createRole: (data: { name: string; code: string; description?: string; is_super?: boolean }) =>
    api.post<Role>('/admin/rbac/roles', data),
  updateRole: (roleId: number, data: Partial<Role>) =>
    api.put<Role>(`/admin/rbac/roles/${roleId}`, data),
  deleteRole: (roleId: number) =>
    api.delete<null>(`/admin/rbac/roles/${roleId}`),
  getRolePermissions: (roleCode: string) =>
    api.get<Permission[]>(`/admin/rbac/roles/${roleCode}/permissions`),
  assignRolePermissions: (roleCode: string, permissionCodes: string[]) =>
    api.post<null>('/admin/rbac/roles/permissions', { role_code: roleCode, permission_codes: permissionCodes }),
  
  // Menu CRUD
  listMenus: () => api.get<Menu[]>('/admin/rbac/menus'),
  createMenu: (data: Partial<Menu>) =>
    api.post<Menu>('/admin/rbac/menus', data),
  updateMenu: (menuId: number, data: Partial<Menu>) =>
    api.put<Menu>(`/admin/rbac/menus/${menuId}`, data),
  deleteMenu: (menuId: number) =>
    api.delete<null>(`/admin/rbac/menus/${menuId}`),
  getRoleMenus: (roleCode: string) =>
    api.get<Menu[]>(`/admin/rbac/roles/${roleCode}/menus`),
  assignRoleMenus: (roleCode: string, menuIds: number[]) =>
    api.post<null>('/admin/rbac/roles/menus', { role_code: roleCode, menu_ids: menuIds }),
  
  // Admin Management
  listAdmins: () => api.get<AdminDetail[]>('/admin/rbac/admins'),
  updateAdminRole: (adminId: string, roleCode: string) =>
    api.put<null>(`/admin/rbac/admins/${adminId}/role`, { role_code: roleCode }),
  getAdminMenus: (adminId: string) =>
    api.get<Menu[]>(`/admin/rbac/admins/${adminId}/menus`),
  getAdminSubjects: (adminId: string) =>
    api.get<string[]>(`/admin/rbac/admins/${adminId}/subjects`),
  
  // Subject Admin (科目授权)
  assignSubjectAdmin: (adminId: string, subjectId: string) =>
    api.post<{ id: number; admin_id: string; subject_id: string }>('/admin/rbac/subject-admins', { admin_id: adminId, subject_id: subjectId }),
  removeSubjectAdmin: (adminId: string, subjectId: string) =>
    api.delete<null>('/admin/rbac/subject-admins', { adminId, subjectId }),
  
  // User Subject (用户科目授权)
  getUserSubjects: (userId: string) =>
    api.get<string[]>(`/admin/rbac/user-subjects/${userId}`),
  getSubjectUsers: (subjectId: string) =>
    api.get<string[]>(`/admin/rbac/user-subjects/subject/${subjectId}`),
  assignUserSubject: (userId: string, subjectId: string) =>
    api.post<null>('/admin/rbac/user-subjects', { user_id: userId, subject_id: subjectId }),
  removeUserSubject: (userId: string, subjectId: string) =>
    api.delete<null>('/admin/rbac/user-subjects', { userId, subjectId }),
};
```

---

## Composables Pattern (Vue3)

### `src/hooks/useApi.ts`

```typescript
import { ref, type Ref } from 'vue';
import type { ApiResponse } from '@/api/client';

interface UseApiResult<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  execute: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<{ data: ApiResponse<T> }>
): UseApiResult<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(true);
  const error = ref<string | null>(null);

  const execute = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiCall();
      data.value = response.data.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '请求失败';
    } finally {
      loading.value = false;
    }
  };

  execute();

  return { data, loading, error, execute };
}
```

### Usage Example

```vue
<script setup lang="ts">
import { useApi } from '@/hooks/useApi';
import { subjectsApi } from '@/api/exam-server/subjects';

const { data: subjects, loading, error } = useApi(() => subjectsApi.list());
</script>

<template>
  <el-table v-loading="loading" :data="subjects">
    <el-table-column prop="id" label="ID" />
    <el-table-column prop="name" label="名称" />
  </el-table>
  <el-alert v-if="error" type="error" :title="error" />
</template>
```

---

## Error Handling Best Practices

| 场景 | 处理方式 |
|------|----------|
| 401未登录 | Axios拦截器自动跳转登录页 |
| 403权限不足 | `ElMessage.error('权限不足')` |
| 404不存在 | `ElMessage.warning('资源不存在')` + 返回列表 |
| 409冲突 | 显示具体冲突原因（如"科目下有题目，无法删除"） |
| 网络超时 | `ElMessage.error('网络连接超时，请稍后重试')` |
| 服务器休眠 | Loading态 + "正在连接服务器..." |