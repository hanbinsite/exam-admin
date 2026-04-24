<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { fetchScoreList, fetchScoreStats } from '@/service/api';
import { useExamStore } from '@/store/modules/exam';

defineOptions({ name: 'ScoreList' });

const examStore = useExamStore();
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

onMounted(() => {
  if (examStore.subjects.length === 0) {
    examStore.loadSubjects();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <div class="flex items-center gap-12px">
      <span class="text-16px font-medium">科目：</span>
      <ElSelect v-model="examStore.currentSubjectId" placeholder="选择科目" style="width: 200px">
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

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <p>成绩列表</p>
      </template>
      <ElTable v-loading="loading" :data="scoreList" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="user_name" label="学生姓名" min-width="120" />
        <ElTableColumn prop="user_email" label="邮箱" min-width="200" />
        <ElTableColumn prop="attempt_number" label="尝试次数" width="100" align="center" />
        <ElTableColumn prop="total_score" label="总分" width="100" align="center" />
        <ElTableColumn prop="submitted_at" label="提交时间" width="180" />
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
