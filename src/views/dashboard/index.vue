<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { fetchDashboardOverview, fetchSubjectList } from '@/service/api';

defineOptions({ name: 'DashboardPage' });

const loading = ref(false);
const overview = ref<Exam.Dashboard.DashboardData>({
  total_users: 0,
  total_submissions: 0,
  active_subjects: 0
});

const subjects = ref<Exam.Subject.Subject[]>([]);
const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

async function loadDashboard() {
  loading.value = true;
  const [overviewRes, subjectsRes] = await Promise.all([fetchDashboardOverview(), fetchSubjectList()]);
  if (!overviewRes.error && overviewRes.data) {
    overview.value = overviewRes.data;
  }
  if (!subjectsRes.error && subjectsRes.data) {
    subjects.value = subjectsRes.data.items;
  }
  loading.value = false;
}

function renderChart() {
  if (!chartRef.value || !subjects.value.length) return;
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }
  const sorted = [...subjects.value].sort((a, b) => (b.stats?.totalQuestions ?? 0) - (a.stats?.totalQuestions ?? 0));
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: sorted.map(s => s.name), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '题目数',
        type: 'bar',
        data: sorted.map(s => s.stats?.totalQuestions ?? 0),
        itemStyle: { color: '#409eff' }
      },
      {
        name: '资料数',
        type: 'bar',
        data: sorted.map(s => s.stats?.totalMaterials ?? 0),
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '考试数',
        type: 'bar',
        data: sorted.map(s => s.stats?.totalExams ?? 0),
        itemStyle: { color: '#e6a23c' }
      }
    ],
    legend: { bottom: 0 }
  });
}

watch(subjects, renderChart, { deep: true });

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
      <div ref="chartRef" class="chart-container" />
    </ElCard>

    <ElCard shadow="hover">
      <template #header>
        <p>科目详情</p>
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

<style scoped>
.chart-container {
  height: 300px;
}
</style>
