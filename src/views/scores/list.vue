<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { PERMISSION_CODES } from '@/constants/permissions';
import { fetchScoreList, fetchScoreStats } from '@/service/api';
import { useExamStore } from '@/store/modules/exam';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'ScoreList' });

const examStore = useExamStore();
const { hasAuth } = useAuth();
const stats = ref<Exam.Score.ScoreStats | null>(null);
const scoreList = ref<Exam.Score.ScoreItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

async function loadData() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const [statsRes, listRes] = await Promise.all([
    fetchScoreStats(examStore.currentSubjectId),
    fetchScoreList(examStore.currentSubjectId, currentPage.value, pageSize.value)
  ]);
  if (!statsRes.error && statsRes.data) stats.value = statsRes.data;
  if (!listRes.error && listRes.data) {
    scoreList.value = listRes.data.items;
    total.value = listRes.data.total;
  }
  loading.value = false;
}

watch(
  () => examStore.currentSubjectId,
  () => {
    currentPage.value = 1;
    loadData();
  }
);

function handlePageChange(page: number) {
  currentPage.value = page;
  loadData();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadData();
}

function formatDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function exportCSV() {
  if (!scoreList.value.length) return;
  const headers = ['ID', '学生姓名', '邮箱', '尝试次数', '总分', '提交时间'];
  const rows = scoreList.value.map(item =>
    [
      item.id,
      item.user_name,
      item.user_email,
      item.attempt_number,
      item.total_score,
      formatDate(item.submitted_at)
    ].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scores_${examStore.currentSubjectId}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const distributionSegments = ref<{ label: string; count: number }[]>([]);

watch(
  () => stats.value,
  statsVal => {
    if (!statsVal?.score_distribution) {
      distributionSegments.value = [];
      return;
    }
    const segments = [
      { label: '0-20', min: 0, max: 20 },
      { label: '20-40', min: 20, max: 40 },
      { label: '40-60', min: 40, max: 60 },
      { label: '60-80', min: 60, max: 80 },
      { label: '80-100', min: 80, max: 100 }
    ];
    const dist = statsVal.score_distribution;
    distributionSegments.value = segments.map(seg => {
      let count = 0;
      for (const [key, entryVal] of Object.entries(dist)) {
        const score = Number(key);
        if (!Number.isNaN(score) && score >= seg.min && score < seg.max) {
          count += entryVal;
        }
      }
      if (seg.label === '80-100') {
        for (const [key, entryVal] of Object.entries(dist)) {
          const score = Number(key);
          if (!Number.isNaN(score) && score === 100) count += entryVal;
        }
      }
      return { label: seg.label, count };
    });
  },
  { deep: true }
);

const maxDistCount = ref(0);
watch(distributionSegments, val => {
  maxDistCount.value = Math.max(...val.map(v => v.count), 1);
});

onMounted(() => {
  if (examStore.subjects.length === 0) {
    examStore.loadSubjects();
  }
  if (examStore.currentSubjectId) {
    loadData();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <div class="flex items-center gap-12px">
      <span class="text-16px font-medium">科目：</span>
      <ElSelect v-model="examStore.currentSubjectId" placeholder="选择科目" class="w-select">
        <ElOption v-for="s in examStore.subjects" :key="s.id" :label="s.name" :value="s.id" />
      </ElSelect>
    </div>

    <ElRow v-if="stats" :gutter="16">
      <ElCol :sm="6" :xs="12">
        <ElCard shadow="hover"><ElStatistic title="平均分" :value="stats.average_score" /></ElCard>
      </ElCol>
      <ElCol :sm="6" :xs="12">
        <ElCard shadow="hover"><ElStatistic title="最高分" :value="stats.max_score" /></ElCard>
      </ElCol>
      <ElCol :sm="6" :xs="12">
        <ElCard shadow="hover"><ElStatistic title="最低分" :value="stats.min_score" /></ElCard>
      </ElCol>
      <ElCol :sm="6" :xs="12">
        <ElCard shadow="hover"><ElStatistic title="提交总数" :value="stats.total_submissions" /></ElCard>
      </ElCol>
    </ElRow>

    <ElCard v-if="distributionSegments.length > 0" shadow="hover">
      <template #header>
        <p>分数分布</p>
      </template>
      <div class="dist-chart flex items-end gap-16px">
        <div v-for="seg in distributionSegments" :key="seg.label" class="flex flex-col flex-1 items-center">
          <div
            class="w-full rounded-t bg-blue-500 transition-all"
            :style="{ height: `${(seg.count / maxDistCount) * 120}px` }"
          />
          <span class="mt-4px text-xs text-gray-500">{{ seg.label }}</span>
          <span class="text-xs font-medium">{{ seg.count }}</span>
        </div>
      </div>
    </ElCard>

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>成绩列表</p>
          <ElButton v-if="hasAuth(PERMISSION_CODES.SCORE_VIEW)" type="success" @click="exportCSV">导出CSV</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="scoreList" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="user_name" label="学生姓名" min-width="120" />
        <ElTableColumn prop="user_email" label="邮箱" min-width="200" />
        <ElTableColumn prop="attempt_number" label="尝试次数" width="100" align="center" />
        <ElTableColumn prop="total_score" label="总分" width="100" align="center" />
        <ElTableColumn label="提交时间" width="180">
          <template #default="{ row }">{{ formatDate(row.submitted_at) }}</template>
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
  </div>
</template>

<style scoped>
.w-select {
  width: 200px;
}

.dist-chart {
  height: 160px;
}
</style>
