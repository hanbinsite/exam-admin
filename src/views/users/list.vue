<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { PERMISSION_CODES } from '@/constants/permissions';
import {
  fetchActivateUser,
  fetchAssignUserCode,
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
  </div>
</template>

<style scoped></style>
