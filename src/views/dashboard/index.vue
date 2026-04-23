<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchDashboardOverview } from '@/service/api';

defineOptions({ name: 'DashboardPage' });

const loading = ref(false);
const overview = ref<Exam.Dashboard.DashboardData>({
  total_users: 0,
  total_submissions: 0,
  active_subjects: 0
});

async function loadDashboard() {
  loading.value = true;
  const { data, error } = await fetchDashboardOverview();
  if (!error && data) {
    overview.value = data;
  }
  loading.value = false;
}

onMounted(loadDashboard);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElRow :gutter="16">
      <ElCol :sm="8" :xs="24">
        <ElCard v-loading="loading" shadow="hover">
          <ElStatistic title="注册学生数" :value="overview.total_users" />
        </ElCard>
      </ElCol>
      <ElCol :sm="8" :xs="24">
        <ElCard v-loading="loading" shadow="hover">
          <ElStatistic title="考试提交数" :value="overview.total_submissions" />
        </ElCard>
      </ElCol>
      <ElCol :sm="8" :xs="24">
        <ElCard v-loading="loading" shadow="hover">
          <ElStatistic title="激活科目数" :value="overview.active_subjects" />
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<style scoped></style>
