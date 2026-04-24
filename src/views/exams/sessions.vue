<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchExamList, fetchExamSessionById, fetchExamSessionList } from '@/service/api';
import { useExamStore } from '@/store/modules/exam';

defineOptions({ name: 'ExamSessions' });

const route = useRoute();
const examStore = useExamStore();
const exams = ref<Exam.ExamModule.ExamConfig[]>([]);
const currentExamId = ref<number | null>(null);
const sessions = ref<Exam.ExamSession.ExamSessionItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const detailVisible = ref(false);
const detailLoading = ref(false);
const sessionDetail = ref<Exam.ExamSession.ExamSessionDetail | null>(null);

const statusMap: Record<string, { label: string; type: 'success' | 'warning' | 'info' }> = {
  completed: { label: '已完成', type: 'success' },
  in_progress: { label: '进行中', type: 'warning' },
  expired: { label: '已过期', type: 'info' }
};

async function loadExams() {
  if (!examStore.currentSubjectId) return;
  const { data, error } = await fetchExamList(examStore.currentSubjectId);
  if (!error && data) {
    exams.value = data;
    const queryExamId = route.query.examId ? Number(route.query.examId) : null;
    if (queryExamId && data.some(e => e.id === queryExamId)) {
      currentExamId.value = queryExamId;
    } else {
      currentExamId.value = null;
      sessions.value = [];
      total.value = 0;
    }
  }
}

async function loadSessions() {
  if (!currentExamId.value) return;
  loading.value = true;
  const { data, error } = await fetchExamSessionList(currentExamId.value, currentPage.value, pageSize.value);
  if (!error && data) {
    sessions.value = data.items;
    total.value = data.total;
  }
  loading.value = false;
}

watch(
  () => examStore.currentSubjectId,
  () => {
    loadExams();
  }
);

watch(currentExamId, () => {
  currentPage.value = 1;
  loadSessions();
});

function handlePageChange(page: number) {
  currentPage.value = page;
  loadSessions();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadSessions();
}

async function handleViewDetail(sessionId: number) {
  detailVisible.value = true;
  detailLoading.value = true;
  const { data, error } = await fetchExamSessionById(sessionId);
  if (!error && data) {
    sessionDetail.value = data;
  }
  detailLoading.value = false;
}

onMounted(() => {
  if (examStore.subjects.length === 0) {
    examStore.loadSubjects();
  } else {
    loadExams();
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
      <span class="ml-16px text-16px font-medium">考试：</span>
      <ElSelect
        v-model="currentExamId"
        placeholder="选择考试"
        style="width: 200px"
        :disabled="!examStore.currentSubjectId"
      >
        <ElOption v-for="e in exams" :key="e.id" :label="e.name" :value="e.id" />
      </ElSelect>
    </div>

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <p>考试场次</p>
      </template>
      <ElTable v-loading="loading" :data="sessions" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="user_name" label="学生姓名" min-width="120" />
        <ElTableColumn prop="user_email" label="邮箱" min-width="200" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="statusMap[row.status]?.type || 'info'">
              {{ statusMap[row.status]?.label || row.status }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="started_at" label="开始时间" width="180" />
        <ElTableColumn prop="completed_at" label="完成时间" width="180" />
        <ElTableColumn label="操作" width="100" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleViewDetail(row.id)">详情</ElButton>
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

    <ElDialog v-model="detailVisible" title="考试场次详情" width="600px">
      <div v-loading="detailLoading">
        <template v-if="sessionDetail">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="学生姓名">{{ sessionDetail.user_name }}</ElDescriptionsItem>
            <ElDescriptionsItem label="邮箱">{{ sessionDetail.user_email }}</ElDescriptionsItem>
            <ElDescriptionsItem label="考试名称">{{ sessionDetail.exam_name }}</ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <ElTag :type="statusMap[sessionDetail.status]?.type || 'info'">
                {{ statusMap[sessionDetail.status]?.label || sessionDetail.status }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="开始时间">{{ sessionDetail.started_at }}</ElDescriptionsItem>
            <ElDescriptionsItem label="完成时间">{{ sessionDetail.completed_at || '-' }}</ElDescriptionsItem>
          </ElDescriptions>
          <div v-if="sessionDetail.selected_questions" class="mt-16px">
            <h4 class="mb-8px font-medium">抽题结果</h4>
            <ElInput
              :model-value="JSON.stringify(sessionDetail.selected_questions, null, 2)"
              type="textarea"
              :rows="6"
              readonly
            />
          </div>
        </template>
      </div>
      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
