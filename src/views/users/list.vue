<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchResetUserPassword, fetchUserList } from '@/service/api';

defineOptions({ name: 'UserList' });

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

async function loadUsers() {
  loading.value = true;
  const { data, error } = await fetchUserList(currentPage.value, pageSize.value);
  if (!error && data) {
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase();
      users.value = data.items.filter(u => u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw));
      total.value = users.value.length;
    } else {
      users.value = data.items;
      total.value = data.total;
    }
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
  const { error } = await fetchResetUserPassword(currentUserId.value, newPassword.value);
  if (!error) {
    ElMessage.success('密码重置成功');
    resetPwdDialogVisible.value = false;
  }
  resetPwdSubmitting.value = false;
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
        <ElTableColumn prop="created_at" label="注册时间" width="180" />
        <ElTableColumn label="操作" width="150" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleResetPwd(row)">重置密码</ElButton>
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
          <ElInput v-model="newPassword" type="password" show-password placeholder="输入新密码" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="resetPwdDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="resetPwdSubmitting" @click="handleResetPwdSubmit">确认重置</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
