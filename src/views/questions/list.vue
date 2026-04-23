<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  fetchBatchImportQuestions,
  fetchCreateQuestion,
  fetchQuestionStats,
  fetchQuestionTypeList,
  fetchSubjectList,
  fetchUpdateQuestion
} from '@/service/api';

defineOptions({ name: 'QuestionList' });

const subjects = ref<Exam.Subject.Subject[]>([]);
const currentSubjectId = ref('');
const questionTypes = ref<Exam.QuestionType.QuestionType[]>([]);
const stats = ref<Exam.Question.QuestionStats | null>(null);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增题目');
const submitting = ref(false);
const importVisible = ref(false);
const importText = ref('');
const importing = ref(false);

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

async function loadSubjects() {
  const { data, error } = await fetchSubjectList();
  if (!error && data) {
    subjects.value = data;
    if (data.length > 0 && !currentSubjectId.value) {
      currentSubjectId.value = data[0].id;
    }
  }
}

async function loadData() {
  if (!currentSubjectId.value) return;
  loading.value = true;
  const [statsRes, typesRes] = await Promise.all([
    fetchQuestionStats(currentSubjectId.value),
    fetchQuestionTypeList(currentSubjectId.value)
  ]);
  if (!statsRes.error && statsRes.data) stats.value = statsRes.data;
  if (!typesRes.error && typesRes.data) questionTypes.value = typesRes.data;
  loading.value = false;
}

watch(currentSubjectId, () => {
  loadData();
});

function handleAdd() {
  resetForm();
  form.subject_id = currentSubjectId.value;
  dialogTitle.value = '新增题目';
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  form.subject_id = currentSubjectId.value;
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
      item.subject_id = currentSubjectId.value;
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

const difficultyMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'danger' }> = {
  easy: { label: '简单', type: 'success' },
  medium: { label: '中等', type: 'warning' },
  hard: { label: '困难', type: 'danger' }
};

onMounted(loadSubjects);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <div class="flex items-center gap-12px">
      <span class="text-16px font-medium">科目：</span>
      <ElSelect v-model="currentSubjectId" placeholder="选择科目" style="width: 200px">
        <ElOption v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
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
            <ElButton @click="handleImport">批量导入</ElButton>
            <ElButton type="primary" :disabled="!currentSubjectId" @click="handleAdd">新增题目</ElButton>
          </div>
        </div>
      </template>
      <div class="mb-12px text-gray-500">统计功能已加载，题目列表需后端提供列表API</div>
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
