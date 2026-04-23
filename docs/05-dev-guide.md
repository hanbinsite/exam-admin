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
import { authApi } from '@/api/exam-server/auth';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'teacher';
}

interface AuthState {
  admin: AdminInfo | null;
  token: string | null;
}

export const useAuthStore = defineStore('auth-store', {
  state: (): AuthState => ({
    admin: null,
    token: localStg.get('admin_token') || null,
  }),

  getters: {
    isLogin: (state) => !!state.token,
  },

  actions: {
    async login(email: string, password: string) {
      const { data } = await authApi.login(email, password);
      this.token = data.data.token;
      this.admin = data.data.admin;
      localStg.set('admin_token', data.data.token);
      return data.data.admin;
    },

    async register(name: string, email: string, password: string) {
      const { data } = await authApi.register(name, email, password);
      this.token = data.data.token;
      this.admin = data.data.admin;
      localStg.set('admin_token', data.data.token);
      return data.data.admin;
    },

    logout() {
      this.token = null;
      this.admin = null;
      localStg.remove('admin_token');
      const { routerPush } = useRouterPush();
      routerPush('/login');
    },
  },
});
```

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
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { subjectsApi } from '@/api/exam-server/subjects';
import type { Subject } from '@/typings/business';

const subjects = ref<Subject[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingSubject = ref<Subject | null>(null);

const form = reactive({
  id: '',
  name: '',
  description: '',
  category: '',
});

async function fetchSubjects() {
  loading.value = true;
  try {
    const { data } = await subjectsApi.list();
    subjects.value = data.data;
  } catch (e) {
    ElMessage.error('获取科目列表失败');
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  try {
    await subjectsApi.create(form);
    ElMessage.success('创建成功');
    dialogVisible.value = false;
    fetchSubjects();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '创建失败');
  }
}

async function handleDelete(subject: Subject) {
  await ElMessageBox.confirm(`确定删除科目"${subject.name}"？`, '确认删除');
  try {
    await subjectsApi.delete(subject.id);
    ElMessage.success('删除成功');
    fetchSubjects();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败');
  }
}

onMounted(fetchSubjects);
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

SoybeanAdmin使用 Elegant Router，路由从 `src/router/routes/` 目录自动生成。

### 新增业务路由模块

在 `src/router/routes/modules/exam-server/` 下创建路由定义：

```typescript
// src/router/routes/modules/exam-server/subjects.ts
import type { AppRouteRecordRaw } from '@/router/type';

const subjectsRoute: AppRouteRecordRaw = {
  path: '/subjects',
  name: 'subjects',
  component: () => import('@/views/subjects/list.vue'),
  meta: {
    title: '科目管理',
    i18nKey: 'route.subjects',
    icon: 'icon-park-outline:book',
    order: 2,
  },
};

export default subjectsRoute;
```

### 菜单权限配置

在 `src/router/routes/modules/exam-server/` 创建其他业务路由：

- `questions.ts` —题库管理
- `question-types.ts` — 题型管理
- `materials.ts` — 学习资料
- `exams.ts` — 考试配置
- `scores.ts` — 成绩统计
- `users.ts` — 用户管理
- `rbac.ts` — RBAC权限

---

## 类型定义

### `src/typings/business.d.ts`

```typescript
interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'teacher';
}

interface LoginResponse {
  token: string;
  admin: AdminInfo;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
}

interface SubjectCreateRequest {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
}

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

interface Question {
  id: number;
  subject_id: string;
  type_id: number;
  parent_id?: number;
  title: string;
  content?: object;
  answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  category?: string;
  tags?: string[];
}

interface QuestionStats {
  by_type: Record<string, number>;
  by_difficulty: Record<string, number>;
}

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

interface Exam {
  id: number;
  subject_id: string;
  name: string;
  description?: string;
  duration: number;
  question_rules: Record<string, { count: number; random?: boolean; fixed_ids?: number[] }>;
  scoring_rules: Record<string, number>;
  is_active: boolean;
}

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

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

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
  parent_id: number | null;
  name: string;
  path: string;
  icon?: string;
  component?: string;
  permission_code?: string;
  sort_order: number;
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