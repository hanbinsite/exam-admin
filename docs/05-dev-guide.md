# 05 — Dev Guide

## Prerequisites

- Node.js 18+
- pnpm 10.5+

## Init Steps

```bash
# 1. Clone SoybeanAdmin ElementPlus template
git clone https://gitee.com/honghuangdc/soybean-admin-element-plus.git exam-admin
cd exam-admin

# 2. Install dependencies (必须用pnpm)
pnpm install

# 3. Start dev server
pnpm dev

# 4. 访问 http://localhost:3000 查看模板
```

## 配置改造

### `.env` (开发环境)

```env
VITE_API_BASE_URL=https://exam-server.hanbin123.com/api/v1
```

### `.env.prod` (生产环境)

```env
VITE_API_BASE_URL=https://exam-server.hanbin123.com/api/v1
```

### `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Auth 改造

### 修改 `src/store/modules/auth.ts`

SoybeanAdmin内置的auth store默认调用mock登录接口，需要改造为调用 exam-server `/admin/auth/login`：

```typescript
import { defineStore } from 'pinia';
import { fetchAdminLogin, fetchAdminRegister } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import type { AdminInfo } from '@/typings/business';

interface AuthState {
  admin: AdminInfo | null;
  token: string | null;
}

export const useAuthStore = defineStore('auth-store', {
  state: (): AuthState => ({
    admin: null,
    token: localStg.get('token') || null,
  }),

  getters: {
    isLogin: (state) => !!state.token,
  },

  actions: {
    async login(email: string, password: string) {
      const { data, error } = await fetchAdminLogin(email, password);
      if (!error && data) {
        this.token = data.token;
        this.admin = data.admin;
        localStg.set('token', data.token);
        localStg.set('adminInfo', {
          id: data.admin.id,
          name: data.admin.name,
          email: data.admin.email,
          role: data.admin.role
        });
      }
      return data?.admin;
    },

    async register(name: string, email: string, password: string) {
      const { data, error } = await fetchAdminRegister(name, email, password);
      if (!error && data) {
        this.token = data.token;
        this.admin = data.admin;
        localStg.set('token', data.token);
      }
      return data?.admin;
    },

    logout() {
      this.token = null;
      this.admin = null;
      localStg.remove('token');
      const { routerPush } = useRouterPush();
      routerPush('/login');
    },
  },
});
```

> 注意：实际代码使用 `localStg.set('token', value)` 而非 `localStorage.setItem('admin_token', value)`，token 格式为 `Bearer xxx`。

### 修改登录页 `src/views/_builtin/login/index.vue`

复用SoybeanAdmin内置登录页，修改登录逻辑：

```vue
<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const { routerPushByKey } = useRouterPush();

const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.login(form.email, form.password);
    ElMessage.success('登录成功');
    routerPushByKey('dashboard');
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## 组件模式 (Vue3 + ElementPlus)

### SubjectListPage 示例

```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchSubjectList, fetchCreateSubject, fetchDeleteSubject } from '@/service/api';
import type { Exam } from '@/typings/api/exam';

const subjects = ref<Exam.Subject.Subject[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);

const form = reactive({
  id: '',
  name: '',
  description: '',
  category: '',
});

async function loadSubjects() {
  loading.value = true;
  const { data, error } = await fetchSubjectList();
  if (!error && data) {
    subjects.value = data.items;
  }
  loading.value = false;
}

async function handleCreate() {
  const { data, error } = await fetchCreateSubject(form);
  if (!error && data) {
    ElMessage.success('创建成功');
    dialogVisible.value = false;
    loadSubjects();
  }
}

async function handleDelete(subject: Exam.Subject.Subject) {
  await ElMessageBox.confirm(`确定删除科目"${subject.name}"？`, '确认删除');
  const { error } = await fetchDeleteSubject(subject.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadSubjects();
  }
}

onMounted(loadSubjects);
</script>

<template>
  <div class="p-4">
    <el-button type="primary" @click="dialogVisible = true">新增科目</el-button>
    
    <el-table v-loading="loading" :data="subjects" class="mt-4">
      <el-table-column prop="id" label="ID" width="120" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="stats.totalQuestions" label="题目数" width="100" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="editingSubject = row">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增科目" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="ID" required>
          <el-input v-model="form.id" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>
```

> 注意：`request<T>()` 的 `transform` 已自动提取 `response.data.data`，所以直接 `data.items` 而不是 `data.data.items`。API 调用返回 `{ data, error }` 结构，需先检查 `error` 再使用 `data`。

---

## QuestionForm 组件（选项编辑器）

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QuestionCreateRequest } from '@/typings/business';

const props = defineProps<{
  subjectId: string;
  typeId: number;
}>();

const emit = defineEmits<{
  submit: [data: QuestionCreateRequest];
  cancel: [];
}>();

const form = reactive<QuestionCreateRequest>({
  subject_id: props.subjectId,
  type_id: props.typeId,
  title: '',
  content: { options: [] },
  answer: '',
  explanation: '',
  difficulty: 'medium',
  score: 1,
  category: '',
  tags: [],
});

const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F'];

function addOption() {
  if (!form.content?.options) form.content = { options: [] };
  const nextKey = optionKeys[form.content.options.length] || 'G';
  form.content.options.push({ key: nextKey, text: '' });
}

function removeOption(index: number) {
  form.content?.options?.splice(index, 1);
}

async function handleSubmit() {
  emit('submit', form);
}
</script>

<template>
  <el-form :model="form" label-width="80px">
    <el-form-item label="题干" required>
      <el-input v-model="form.title" type="textarea" :rows="3" />
    </el-form-item>
    
    <el-form-item label="选项" v-if="form.content?.options">
      <div class="space-y-2">
        <div v-for="(opt, idx) in form.content.options" :key="idx" class="flex gap-2">
          <el-input :value="opt.key" style="width: 40px" disabled />
          <el-input v-model="opt.text" placeholder="选项内容" />
          <el-button link type="danger" @click="removeOption(idx)">删除</el-button>
        </div>
        <el-button @click="addOption">添加选项</el-button>
      </div>
    </el-form-item>
    
    <el-form-item label="正确答案" required>
      <el-select v-model="form.answer">
        <el-option v-for="opt in form.content?.options" :key="opt.key" :label="opt.key" :value="opt.key" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="解析">
      <el-input v-model="form.explanation" type="textarea" />
    </el-form-item>
    
    <el-form-item label="难度">
      <el-select v-model="form.difficulty">
        <el-option label="简单" value="easy" />
        <el-option label="中等" value="medium" />
        <el-option label="困难" value="hard" />
      </el-select>
    </el-form-item>
    
    <el-form-item label="分值">
      <el-input-number v-model="form.score" :min="0.5" :step="0.5" />
    </el-form-item>
    
    <el-form-item label="分类">
      <el-input v-model="form.category" />
    </el-form-item>
  </el-form>
  
  <div class="flex justify-end gap-2">
    <el-button @click="emit('cancel')">取消</el-button>
    <el-button type="primary" @click="handleSubmit">提交</el-button>
  </div>
</template>
```

---

## 路由配置 (Elegant Router)

SoybeanAdmin 使用 Elegant Router，路由从页面目录结构和插件配置自动生成。`src/router/elegant/routes.ts` 为自动生成的路由映射表，`src/router/elegant/transform.ts` 负责将路由定义转换为 Vue Router 配置。

### 新增页面路由

在 `src/views/` 下按目录创建页面文件，插件会自动扫描生成路由：

```
src/views/
├── subjects/list.vue       → 路由 name: "subjects_list", path: /subjects/list
├── questions/list.vue      → 路由 name: "questions_list", path: /questions/list
├── rbac/admins.vue         → 路由 name: "rbac_admins", path: /rbac/admins
└── ...
```

路由映射规则：
- 目录名 → 一级路由 path（如 `subjects/` → `/subjects`）
- 文件名 → 二级路由 path（如 `list.vue` → `/subjects/list`）
- 路由 name 格式：`{目录}_{文件名}`（如 `subjects_list`）

### 业务路由模块清单

- `dashboard/index.vue` — 仪表盘
- `subjects/list.vue` — 科目管理
- `question-types/list.vue` — 题型管理
- `questions/list.vue` — 题库管理
- `questions/detail.vue` — 题目详情/编辑
- `materials/list.vue` — 学习资料
- `exams/list.vue` — 考试配置
- `exams/sessions.vue` — 考试场次
- `scores/list.vue` — 成绩统计
- `knowledge-points/list.vue` — 知识点管理
- `users/list.vue` — 用户管理
- `rbac/permissions.vue` — 权限管理
- `rbac/roles.vue` — 角色管理
- `rbac/menus.vue` — 菜单管理
- `rbac/admins.vue` — 管理员管理
- `user-center/index.vue` — 用户中心

---

## 类型定义

### `src/typings/api/exam.d.ts`

类型定义使用 `declare namespace Exam` 命名空间组织，位于 `src/typings/api/exam.d.ts`。各模块类型通过子命名空间划分：

```typescript
declare namespace Exam {
  namespace Auth {
    interface AdminInfo {
      id: string;
      name: string;
      email: string;
      role: string;
    }
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
    interface LoginToken {
      token: string;
      admin: AdminInfo;
    }
    // Menu 使用嵌套 meta 结构
    interface MenuMeta {
      title: string;
      i18nKey?: string | null;
      icon?: string;
      order?: number;
      hideInMenu?: boolean;
      href?: string;
    }
    interface MenuItem {
      name: string;
      path: string;
      meta: MenuMeta;
      children?: MenuItem[];
    }
  }

  namespace Subject {
    interface Subject {
      id: string;
      name: string;
      description: string;
      category: string;
      icon: string;
      is_active: boolean;
      stats?: { totalQuestions: number; totalMaterials: number; totalExams: number };
    }
    interface SubjectListData {
      items: Subject[];
      total: number;
      page: number;
      page_size: number;
    }
    // ...
  }

  namespace RBAC {
    // Menu 实体同样使用嵌套 meta
    interface MenuMeta {
      title: string;
      i18nKey: string;
      icon: string;
      order: number;
      hideInMenu: boolean;
      href: string | null;
    }
    interface Menu {
      id: number;
      name: string;
      routeKey?: string;
      path: string;
      meta: MenuMeta;
      children?: Menu[];
    }
    // ...
  }
  
  // 其他命名空间: Question, Material, ExamModule, ExamSession, Score, User, KnowledgePoint
}
```

> 注意：Menu 类型使用嵌套 `meta: MenuMeta` 子对象存储 `title/i18nKey/icon/order` 等字段，而非将 `icon`、`sort_order` 等直接作为 Menu 顶层字段。`Exam.scoring_rules` 类型为 `Record<string, number>`（题型名→分值映射）。

### 使用方式

```typescript
// 组件中引用类型
import type { Exam } from '@/typings/api/exam';

const subject: Exam.Subject.Subject = { ... };
const list: Exam.Subject.SubjectListData = { items: [], total: 0, page: 1, page_size: 20 };
```

---

## 测试策略

- SoybeanAdmin 已内置完整的基础设施测试
- 业务代码以功能验证为主，不需要额外测试框架
- 关键页面手动验证：登录、CRUD操作、权限控制

---

## 部署

```bash
# 构建
pnpm build

# 本地预览
pnpm preview

# 推送到GitHub触发Vercel自动部署
git push github main
```

### Vercel环境变量

在 Vercel Dashboard 设置：
- `VITE_API_BASE_URL` = `https://exam-server.hanbin123.com/api/v1`