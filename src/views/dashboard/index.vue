<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchDashboardOverview, fetchSubjectList } from '@/service/api';

defineOptions({ name: 'DashboardPage' });

const loading = ref(false);
const overview = ref<Exam.Dashboard.DashboardData>({
  total_users: 0,
  total_submissions: 0,
  active_subjects: 0
});

const subjects = ref<Exam.Subject.Subject[]>([]);

async function loadDashboard() {
  loading.value = true;
  const [overviewRes, subjectsRes] = await Promise.all([fetchDashboardOverview(), fetchSubjectList()]);
  if (!overviewRes.error && overviewRes.data) {
    overview.value = overviewRes.data;
  }
  if (!subjectsRes.error && subjectsRes.data) {
    subjects.value = subjectsRes.data;
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

    <ElCard shadow="hover">
      <template #header>
        <p>科目概览</p>
      </template>
      <ElTable :data="subjects" border stripe>
        <ElTableColumn prop="id" label="ID" width="120" />
        <ElTableColumn prop="name" label="科目名称" min-width="150" />
        <ElTableColumn prop="category" label="分类" width="120" />
        <ElTableColumn label="状态" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="题目数" width="100" align="center">
          <template #default="{ row }">{{ row.stats?.totalQuestions ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="资料数" width="100" align="center">
          <template #default="{ row }">{{ row.stats?.totalMaterials ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="考试数" width="100" align="center">
          <template #default="{ row }">{{ row.stats?.totalExams ?? '-' }}</template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<style scoped></style>
