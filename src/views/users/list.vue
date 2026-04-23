<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchUserList } from '@/service/api';

defineOptions({ name: 'UserList' });

const users = ref<Exam.User.User[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const searchKeyword = ref('');

async function loadUsers() {
  loading.value = true;
  const { data, error } = await fetchUserList(currentPage.value, pageSize.value);
  if (!error && data) {
    users.value = data.items;
    total.value = data.total;
  }
  loading.value = false;
}

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value;
  const kw = searchKeyword.value.toLowerCase();
  return users.value.filter(u => u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw));
});

function handlePageChange(page: number) {
  currentPage.value = page;
  loadUsers();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadUsers();
}

onMounted(loadUsers);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>用户管理</p>
          <ElInput v-model="searchKeyword" placeholder="搜索姓名/邮箱" clearable style="width: 250px" />
        </div>
      </template>
      <ElTable v-loading="loading" :data="filteredUsers" border stripe>
        <ElTableColumn prop="id" label="ID" width="280" />
        <ElTableColumn prop="name" label="姓名" min-width="150" />
        <ElTableColumn prop="email" label="邮箱" min-width="250" />
        <ElTableColumn prop="created_at" label="注册时间" width="180" />
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
  </div>
</template>

<style scoped></style>
