<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchBatchImportQuestions,
  fetchCreateQuestion,
  fetchDeleteQuestion,
  fetchQuestionList,
  fetchQuestionStats,
  fetchQuestionTypeList,
  fetchUpdateQuestion
} from '@/service/api';
import { useExamStore } from '@/store/modules/exam';

defineOptions({ name: 'QuestionList' });

const examStore = useExamStore();
const questionTypes = ref<Exam.QuestionType.QuestionType[]>([]);
const stats = ref<Exam.Question.QuestionStats | null>(null);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增题目');
const submitting = ref(false);
const importVisible = ref(false);
const importText = ref('');
const importing = ref(false);

const questions = ref<Exam.Question.QuestionListItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const searchKeyword = ref('');
const filterTypeId = ref<number | undefined>(undefined);
const filterDifficulty = ref<'' | 'easy' | 'medium' | 'hard'>('');

const form = reactive<Exam.Question.QuestionCreateRequest>({
  subject_id: '',
  type_id: 0,
  title: '',
  content: {},
  answer: '',
  explanation: '',
  difficulty: 'medium',
  score: 1,
  category: '',
  tags: [],
  sort_order: 0
});

const editingId = ref<number | null>(null);

function resetForm() {
  form.type_id = 0;
  form.title = '';
  form.content = {};
  form.answer = '';
  form.explanation = '';
  form.difficulty = 'medium';
  form.score = 1;
  form.category = '';
  form.tags = [];
  form.sort_order = 0;
  editingId.value = null;
}

async function loadData() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const [statsRes, typesRes, listRes] = await Promise.all([
    fetchQuestionStats(examStore.currentSubjectId),
    fetchQuestionTypeList(examStore.currentSubjectId),
    fetchQuestionList(examStore.currentSubjectId, {
      page: currentPage.value,
      pageSize: pageSize.value,
      type_id: filterTypeId.value,
      difficulty: filterDifficulty.value || undefined,
      keyword: searchKeyword.value || undefined
    })
  ]);
  if (!statsRes.error && statsRes.data) stats.value = statsRes.data;
  if (!typesRes.error && typesRes.data) questionTypes.value = typesRes.data;
  if (!listRes.error && listRes.data) {
    questions.value = listRes.data.items;
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

function handleSearch() {
  currentPage.value = 1;
  loadData();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadData();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadData();
}

function handleAdd() {
  resetForm();
  form.subject_id = examStore.currentSubjectId;
  dialogTitle.value = '新增题目';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.Question.QuestionListItem) {
  resetForm();
  editingId.value = row.id;
  form.subject_id = examStore.currentSubjectId;
  form.title = row.title;
  form.answer = row.answer;
  form.difficulty = row.difficulty;
  form.score = row.score;
  form.category = row.category || '';
  form.sort_order = row.sort_order;
  const matchedType = questionTypes.value.find(t => t.name === row.type?.name);
  if (matchedType) {
    form.type_id = matchedType.id;
  }
  dialogTitle.value = '编辑题目';
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  form.subject_id = examStore.currentSubjectId;
  if (editingId.value) {
    const { error } = await fetchUpdateQuestion(editingId.value, form);
    if (!error) {
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      loadData();
    }
  } else {
    const { error } = await fetchCreateQuestion(form);
    if (!error) {
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      loadData();
    }
  }
  submitting.value = false;
}

async function handleDelete(row: Exam.Question.QuestionListItem) {
  await ElMessageBox.confirm(`确定删除题目「${row.title.slice(0, 30)}...」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  });
  const { error } = await fetchDeleteQuestion(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadData();
  }
}

function handleImport() {
  importText.value = '';
  importVisible.value = true;
}

async function handleImportSubmit() {
  if (!importText.value.trim()) {
    ElMessage.warning('请输入JSON数据');
    return;
  }
  importing.value = true;
  try {
    const items: Exam.Question.QuestionCreateRequest[] = JSON.parse(importText.value);
    items.forEach(item => {
      item.subject_id = examStore.currentSubjectId;
    });
    const { data, error } = await fetchBatchImportQuestions(items);
    if (!error && data) {
      ElMessage.success(`导入完成：成功 ${data.created}，跳过 ${data.skipped}`);
      importVisible.value = false;
      loadData();
    }
  } catch {
    ElMessage.error('JSON格式错误，请检查输入');
  }
  importing.value = false;
}

const difficultyMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
  easy: { label: '简单', type: 'success' },
  medium: { label: '中等', type: 'warning' },
  hard: { label: '困难', type: 'danger' }
};

function truncate(text: string, len: number = 40) {
  return text.length > len ? `${text.slice(0, len)}...` : text;
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
      <ElCol v-for="(count, key) in stats.by_type" :key="key" :sm="8" :xs="24">
        <ElCard shadow="hover" class="mb-16px">
          <ElStatistic :title="key" :value="count" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElRow v-if="stats" :gutter="16">
      <ElCol v-for="(count, key) in stats.by_difficulty" :key="key" :sm="8" :xs="24">
        <ElCard shadow="hover" class="mb-16px">
          <ElStatistic :title="(difficultyMap[key] || { label: key }).label" :value="count" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>题库管理</p>
          <div class="flex gap-8px">
            <ElInput
              v-model="searchKeyword"
              placeholder="搜索题目"
              clearable
              style="width: 180px"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
            <ElSelect
              v-model="filterTypeId"
              placeholder="题型筛选"
              clearable
              style="width: 140px"
              @change="handleSearch"
            >
              <ElOption v-for="t in questionTypes" :key="t.id" :label="t.display_name" :value="t.id" />
            </ElSelect>
            <ElSelect
              v-model="filterDifficulty"
              placeholder="难度筛选"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <ElOption label="简单" value="easy" />
              <ElOption label="中等" value="medium" />
              <ElOption label="困难" value="hard" />
            </ElSelect>
            <ElButton @click="handleImport">批量导入</ElButton>
            <ElButton type="primary" :disabled="!examStore.currentSubjectId" @click="handleAdd">新增题目</ElButton>
          </div>
        </div>
      </template>
      <ElTable v-loading="loading" :data="questions" border stripe>
        <ElTableColumn prop="id" label="ID" width="70" />
        <ElTableColumn label="题型" width="100" align="center">
          <template #default="{ row }">
            <ElTag size="small">{{ row.type?.display_name || row.type?.name || '-' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="题干" min-width="300">
          <template #default="{ row }">
            {{ truncate(row.title) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="category" label="分类" width="120" />
        <ElTableColumn label="难度" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="difficultyMap[row.difficulty]?.type" size="small">
              {{ difficultyMap[row.difficulty]?.label || row.difficulty }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="score" label="分值" width="70" align="center" />
        <ElTableColumn prop="answer" label="答案" width="80" align="center" />
        <ElTableColumn label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="题型" required>
          <ElSelect v-model="form.type_id" placeholder="选择题型">
            <ElOption v-for="t in questionTypes" :key="t.id" :label="t.display_name" :value="t.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="题干" required>
          <ElInput v-model="form.title" type="textarea" :rows="3" placeholder="题目内容" />
        </ElFormItem>
        <ElFormItem label="正确答案">
          <ElInput v-model="form.answer" placeholder="正确答案" />
        </ElFormItem>
        <ElFormItem label="解析">
          <ElInput v-model="form.explanation" type="textarea" :rows="2" placeholder="答案解析" />
        </ElFormItem>
        <ElFormItem label="难度">
          <ElSelect v-model="form.difficulty">
            <ElOption label="简单" value="easy" />
            <ElOption label="中等" value="medium" />
            <ElOption label="困难" value="hard" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="分值">
          <ElInputNumber v-model="form.score" :min="0.5" :step="0.5" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElInput v-model="form.category" placeholder="题目分类" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="importVisible" title="批量导入题目" width="600px">
      <ElInput v-model="importText" type="textarea" :rows="10" placeholder="粘贴JSON数组，每个元素为题目对象" />
      <template #footer>
        <ElButton @click="importVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="importing" @click="handleImportSubmit">导入</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
