<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { PERMISSION_CODES } from '@/constants/permissions';
import {
  fetchActivateUser,
  fetchAssignUserCode,
  fetchCreateUser,
  fetchDeleteUser,
  fetchResetUserPassword,
  fetchUserList
} from '@/service/api';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'UserList' });

const { hasAuth } = useAuth();

const users = ref<Exam.User.User[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const searchKeyword = ref('');
const resetPwdDialogVisible = ref(false);
const resetPwdSubmitting = ref(false);
const currentUserId = ref('');
const currentUserName = ref('');
const newPassword = ref('');
const assignCodeDialogVisible = ref(false);
const assignCodeSubmitting = ref(false);
const assignCodeInput = ref('');

const createDialogVisible = ref(false);
const createSubmitting = ref(false);
const createFormRef = ref<FormInstance>();

const createForm = reactive({
  name: '',
  email: '',
  password: '',
  phone: ''
});

const createRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ]
};

async function loadUsers() {
  loading.value = true;
  const { data, error } = await fetchUserList(currentPage.value, pageSize.value, searchKeyword.value || undefined);
  if (!error && data) {
    users.value = data.items;
    total.value = data.total;
  }
  loading.value = false;
}

function handleSearch() {
  currentPage.value = 1;
  loadUsers();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadUsers();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadUsers();
}

function handleResetPwd(row: Exam.User.User) {
  currentUserId.value = row.id;
  currentUserName.value = row.name;
  newPassword.value = '';
  resetPwdDialogVisible.value = true;
}

async function handleResetPwdSubmit() {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('密码长度至少6位');
    return;
  }
  resetPwdSubmitting.value = true;
  try {
    const { error } = await fetchResetUserPassword(currentUserId.value, newPassword.value);
    if (!error) {
      ElMessage.success('密码重置成功');
      resetPwdDialogVisible.value = false;
    }
  } finally {
    resetPwdSubmitting.value = false;
  }
}

async function handleActivate(row: Exam.User.User) {
  await ElMessageBox.confirm(`确定激活用户「${row.name}」吗？`, '激活确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  });
  const { error } = await fetchActivateUser(row.id);
  if (!error) {
    ElMessage.success('激活成功');
    loadUsers();
  }
}

async function handleDeactivate(row: Exam.User.User) {
  await ElMessageBox.confirm(`确定停用用户「${row.name}」吗？停用后该用户将无法登录。`, '停用确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  });
  const { error } = await fetchDeleteUser(row.id);
  if (!error) {
    ElMessage.success('停用成功');
    loadUsers();
  }
}

function handleAssignCode(row: Exam.User.User) {
  currentUserId.value = row.id;
  currentUserName.value = row.name;
  assignCodeInput.value = '';
  assignCodeDialogVisible.value = true;
}

async function handleAssignCodeSubmit() {
  assignCodeSubmitting.value = true;
  try {
    const { data, error } = await fetchAssignUserCode(currentUserId.value, assignCodeInput.value || undefined);
    if (!error && data) {
      ElMessage.success(`查询码已分配：${data.user_code}`);
      assignCodeDialogVisible.value = false;
    }
  } finally {
    assignCodeSubmitting.value = false;
  }
}

function handleCreateOpen() {
  createForm.name = '';
  createForm.email = '';
  createForm.password = '';
  createForm.phone = '';
  createFormRef.value?.resetFields();
  createDialogVisible.value = true;
}

async function handleCreateSubmit() {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  createSubmitting.value = true;
  try {
    const { error } = await fetchCreateUser({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      phone: createForm.phone || undefined
    });
    if (!error) {
      ElMessage.success('用户创建成功');
      createDialogVisible.value = false;
      loadUsers();
    }
  } finally {
    createSubmitting.value = false;
  }
}

onMounted(loadUsers);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>用户管理</p>
          <div class="flex gap-8px">
            <ElInput
              v-model="searchKeyword"
              placeholder="搜索姓名/邮箱"
              clearable
              style="width: 200px"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
            <ElButton type="primary" @click="handleSearch">搜索</ElButton>
            <ElButton v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)" type="success" @click="handleCreateOpen">
              新增用户
            </ElButton>
          </div>
        </div>
      </template>
      <ElTable v-loading="loading" :data="users" border stripe>
        <ElTableColumn prop="id" label="ID" width="280" />
        <ElTableColumn prop="name" label="姓名" min-width="150" />
        <ElTableColumn prop="email" label="邮箱" min-width="250" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '活跃' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="注册时间" width="180">
          <template #default="{ row }">
            {{ row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="250" align="center">
          <template #default="{ row }">
            <ElButton
              v-if="!row.is_active && hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="success"
              link
              size="small"
              @click="handleActivate(row)"
            >
              激活
            </ElButton>
            <ElButton
              v-if="row.is_active && hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="warning"
              link
              size="small"
              @click="handleDeactivate(row)"
            >
              停用
            </ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="primary"
              link
              size="small"
              @click="handleResetPwd(row)"
            >
              重置密码
            </ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="warning"
              link
              size="small"
              @click="handleAssignCode(row)"
            >
              分配查询码
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-16px flex justify-end">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, sizes"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </ElCard>

    <ElDialog v-model="resetPwdDialogVisible" title="重置用户密码" width="400px">
      <ElForm label-width="80px">
        <ElFormItem label="用户">
          <ElInput :model-value="currentUserName" disabled />
        </ElFormItem>
        <ElFormItem label="新密码" required>
          <ElInput v-model="newPassword" type="password" show-password placeholder="输入新密码（至少6位）" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="resetPwdDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="resetPwdSubmitting" @click="handleResetPwdSubmit">确认重置</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="assignCodeDialogVisible" title="分配用户查询码" width="400px">
      <ElForm label-width="80px">
        <ElFormItem label="用户">
          <ElInput :model-value="currentUserName" disabled />
        </ElFormItem>
        <ElFormItem label="查询码">
          <ElInput v-model="assignCodeInput" placeholder="留空则自动生成" maxlength="12" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="assignCodeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="assignCodeSubmitting" @click="handleAssignCodeSubmit">确认分配</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="createDialogVisible" title="新增用户" width="450px">
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <ElFormItem label="姓名" prop="name">
          <ElInput v-model="createForm.name" placeholder="请输入姓名" maxlength="100" />
        </ElFormItem>
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="createForm.email" placeholder="请输入邮箱" maxlength="200" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput v-model="createForm.password" type="password" show-password placeholder="6-20位，含字母和数字" />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="createForm.phone" placeholder="请输入手机号（选填）" maxlength="20" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="createSubmitting" @click="handleCreateSubmit">确认创建</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
