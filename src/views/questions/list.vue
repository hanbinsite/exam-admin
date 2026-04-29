<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import * as echarts from 'echarts';
import { PERMISSION_CODES } from '@/constants/permissions';
import {
  fetchBatchImportQuestions,
  fetchCreateQuestion,
  fetchDeleteQuestion,
  fetchQuestionDetail,
  fetchQuestionList,
  fetchQuestionStats,
  fetchQuestionTypeList,
  fetchUpdateQuestion
} from '@/service/api';
import { useExamStore } from '@/store/modules/exam';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'QuestionList' });

const examStore = useExamStore();
const { hasAuth } = useAuth();
const questionTypes = ref<Exam.QuestionType.QuestionType[]>([]);
const stats = ref<Exam.Question.QuestionStats | null>(null);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增题目');
const submitting = ref(false);
const importVisible = ref(false);
const importText = ref('');
const importing = ref(false);
const formRef = ref<FormInstance>();

const questions = ref<Exam.Question.QuestionListItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const searchKeyword = ref('');
const filterTypeId = ref<number | undefined>(undefined);
const filterDifficulty = ref<'' | 'easy' | 'medium' | 'hard'>('');
const filterCategory = ref('');

const categories = ref<string[]>([]);

const detailVisible = ref(false);
const detailItem = ref<Exam.Question.Question | null>(null);
const pieRef = ref<HTMLElement>();
let pieInstance: echarts.ECharts | null = null;

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

const rules: FormRules = {
  type_id: [
    {
      required: true,
      message: '请选择题型',
      trigger: 'change',
      type: 'number',
      validator: (_r, v, cb) => {
        if (!v || v === 0) cb(new Error('请选择题型'));
        else cb();
      }
    }
  ],
  title: [{ required: true, message: '请输入题干', trigger: 'blur' }]
};

const editingId = ref<number | null>(null);
const tagInput = ref('');
const currentTypeName = ref('');

const optionItems = ref<{ key: string; text: string }[]>([]);
const correctAnswer = ref<string>('');
const correctAnswerMulti = ref<string[]>([]);

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
  optionItems.value = [];
  correctAnswer.value = '';
  correctAnswerMulti.value = [];
  tagInput.value = '';
  formRef.value?.resetFields();
}

function addOption() {
  const keys = 'ABCDEFGH'.split('');
  const usedKeys = optionItems.value.map(o => o.key);
  const nextKey = keys.find(k => !usedKeys.includes(k)) || String(optionItems.value.length + 1);
  optionItems.value.push({ key: nextKey, text: '' });
}

function removeOption(index: number) {
  optionItems.value.splice(index, 1);
}

function buildContentFromOptions() {
  if (optionItems.value.length > 0) {
    form.content = { options: optionItems.value.filter(o => o.text.trim()) };
  } else {
    form.content = {};
  }
}

function syncAnswerFromOptions() {
  if (currentTypeName.value === 'multi_choice') {
    form.answer = correctAnswerMulti.value.join(',');
  } else {
    form.answer = correctAnswer.value;
  }
}

function addTag() {
  const tags = tagInput.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  form.tags = [...new Set([...(form.tags || []), ...tags])];
  tagInput.value = '';
}

function removeTag(tag: string) {
  form.tags = (form.tags || []).filter(t => t !== tag);
}

async function loadData() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const [listRes, statsRes, typesRes] = await Promise.all([
    fetchQuestionList(examStore.currentSubjectId, {
      page: currentPage.value,
      pageSize: pageSize.value,
      type_id: filterTypeId.value,
      difficulty: filterDifficulty.value || undefined,
      category: filterCategory.value || undefined,
      keyword: searchKeyword.value || undefined
    }),
    fetchQuestionStats(examStore.currentSubjectId),
    fetchQuestionTypeList(examStore.currentSubjectId)
  ]);
  if (!listRes.error && listRes.data) {
    questions.value = listRes.data.items;
    total.value = listRes.data.total;
    const cats = new Set<string>();
    listRes.data.items.forEach(q => {
      if (q.category) cats.add(q.category);
    });
    categories.value = [...cats].sort();
  }
  if (!statsRes.error && statsRes.data) {
    stats.value = statsRes.data;
  }
  if (!typesRes.error && typesRes.data) {
    questionTypes.value = typesRes.data;
  }
  loading.value = false;

  if (stats.value?.by_difficulty) {
    renderPie();
  }
}

function renderPie() {
  if (!pieRef.value || !stats.value?.by_difficulty) return;
  if (!pieInstance) {
    pieInstance = echarts.init(pieRef.value);
  }
  const diffMap: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  const data = Object.entries(stats.value.by_difficulty).map(([key, count]) => ({
    name: diffMap[key] || key,
    value: count
  }));
  pieInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data,
        label: { show: true, formatter: '{b}\n{d}%' },
        itemStyle: { borderRadius: 4 }
      }
    ]
  });
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

async function handleEdit(row: Exam.Question.QuestionListItem) {
  resetForm();
  editingId.value = row.id;
  form.subject_id = examStore.currentSubjectId;
  form.title = row.title;
  form.answer = row.answer;
  form.difficulty = row.difficulty;
  form.score = row.score;
  form.category = row.category || '';
  form.sort_order = row.sort_order;

  const { data: detail } = await fetchQuestionDetail(row.id);
  if (detail) {
    form.content = detail.content || {};
    form.explanation = detail.explanation || '';
    form.tags = detail.tags || [];
    if (detail.content?.options) {
      optionItems.value = detail.content.options.map(opt => ({ key: opt.key, text: opt.text }));
    }
    if (detail.answer) {
      form.answer = detail.answer;
      correctAnswer.value = detail.answer;
      correctAnswerMulti.value = detail.answer.split(',');
    }
  }

  correctAnswer.value = form.answer;
  correctAnswerMulti.value = form.answer ? form.answer.split(',') : [];
  const matchedType = questionTypes.value.find(t => t.name === row.type?.name);
  if (matchedType) {
    form.type_id = matchedType.id;
  }
  dialogTitle.value = '编辑题目';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  buildContentFromOptions();
  syncAnswerFromOptions();
  submitting.value = true;
  try {
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
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: Exam.Question.QuestionListItem) {
  const title = row.title.length > 30 ? `${row.title.slice(0, 30)}...` : row.title;
  await ElMessageBox.confirm(`确定删除题目「${title}」吗？`, '删除确认', {
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

async function handleViewDetail(row: Exam.Question.QuestionListItem) {
  const { data } = await fetchQuestionDetail(row.id);
  if (data) {
    detailItem.value = data;
  } else {
    detailItem.value = {
      id: row.id,
      subject_id: examStore.currentSubjectId,
      type_id: 0,
      title: row.title,
      answer: row.answer,
      difficulty: row.difficulty,
      score: row.score,
      category: row.category,
      content: {},
      explanation: '',
      tags: []
    };
  }
  detailVisible.value = true;
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
  } finally {
    importing.value = false;
  }
}

const difficultyMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
  easy: { label: '简单', type: 'success' },
  medium: { label: '中等', type: 'warning' },
  hard: { label: '困难', type: 'danger' }
};

function truncate(text: string, len: number = 40) {
  return text.length > len ? `${text.slice(0, len)}...` : text;
}

function handleFileImport(uploadFile: any) {
  const file = uploadFile?.raw || uploadFile;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    importText.value = (e.target?.result as string) || '';
  };
  reader.readAsText(file);
}

watch(
  () => form.type_id,
  id => {
    const t = questionTypes.value.find(qt => qt.id === id);
    currentTypeName.value = t?.name || '';
    if (!editingId.value) {
      optionItems.value = [];
      correctAnswer.value = '';
      correctAnswerMulti.value = [];
      form.answer = '';
      form.content = {};
    }
  }
);

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
      <ElCol :sm="12" :xs="24">
        <ElCard shadow="hover" class="mb-16px">
          <div ref="pieRef" style="height: 200px" />
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
            <ElSelect
              v-model="filterCategory"
              placeholder="分类筛选"
              clearable
              style="width: 140px"
              @change="handleSearch"
            >
              <ElOption v-for="c in categories" :key="c" :label="c" :value="c" />
            </ElSelect>
            <ElButton v-if="hasAuth(PERMISSION_CODES.QUESTION_MANAGE)" @click="handleImport">批量导入</ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.QUESTION_MANAGE)"
              type="primary"
              :disabled="!examStore.currentSubjectId"
              @click="handleAdd"
            >
              新增题目
            </ElButton>
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
        <ElTableColumn label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="info" link size="small" @click="handleViewDetail(row)">详情</ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.QUESTION_MANAGE)"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.QUESTION_MANAGE)"
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </ElButton>
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="700px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="题型" prop="type_id">
          <ElSelect v-model="form.type_id" placeholder="选择题型">
            <ElOption v-for="t in questionTypes" :key="t.id" :label="t.display_name" :value="t.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="题干" prop="title">
          <ElInput v-model="form.title" type="textarea" :rows="3" placeholder="题目内容" />
        </ElFormItem>

        <ElFormItem v-if="currentTypeName === 'choice' || currentTypeName === 'multi_choice'" label="选项">
          <div class="w-full">
            <div v-for="(opt, idx) in optionItems" :key="idx" class="mb-8px flex items-center gap-8px">
              <ElTag size="small">{{ opt.key }}</ElTag>
              <ElInput v-model="opt.text" placeholder="选项内容" class="flex-1" />
              <ElButton type="danger" link @click="removeOption(idx)">删除</ElButton>
            </div>
            <ElButton type="primary" link @click="addOption">+ 添加选项</ElButton>
          </div>
        </ElFormItem>

        <ElFormItem v-if="currentTypeName === 'choice'" label="正确答案">
          <ElRadioGroup v-model="correctAnswer">
            <ElRadio v-for="opt in optionItems" :key="opt.key" :value="opt.key">{{ opt.key }}</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="currentTypeName === 'multi_choice'" label="正确答案">
          <ElCheckboxGroup v-model="correctAnswerMulti">
            <ElCheckbox v-for="opt in optionItems" :key="opt.key" :label="opt.key" :value="opt.key" />
          </ElCheckboxGroup>
        </ElFormItem>

        <ElFormItem v-if="currentTypeName === 'judgment'" label="正确答案">
          <ElRadioGroup v-model="correctAnswer">
            <ElRadio value="true">正确</ElRadio>
            <ElRadio value="false">错误</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem v-if="currentTypeName === 'fill_blank'" label="正确答案">
          <ElInput v-model="correctAnswer" placeholder="填空题答案" @input="syncAnswerFromOptions" />
        </ElFormItem>

        <ElFormItem
          v-if="
            !['choice', 'multi_choice'].includes(currentTypeName) &&
            currentTypeName !== 'judgment' &&
            currentTypeName !== 'fill_blank'
          "
          label="正确答案"
        >
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
        <ElFormItem label="标签">
          <div class="w-full">
            <div class="mb-8px flex flex-wrap gap-4px">
              <ElTag v-for="tag in form.tags || []" :key="tag" closable @close="removeTag(tag)">{{ tag }}</ElTag>
            </div>
            <div class="flex gap-8px">
              <ElInput v-model="tagInput" placeholder="输入标签，逗号分隔" @keyup.enter="addTag" />
              <ElButton @click="addTag">添加</ElButton>
            </div>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="detailVisible" title="题目详情" width="700px">
      <template v-if="detailItem">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="ID">{{ detailItem.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="题型">{{ detailItem.type_id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="难度" :span="2">
            <ElTag :type="difficultyMap[detailItem.difficulty]?.type" size="small">
              {{ difficultyMap[detailItem.difficulty]?.label || detailItem.difficulty }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="题干" :span="2">
            {{ detailItem.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailItem.content?.options" label="选项" :span="2">
            <div v-for="opt in detailItem.content.options" :key="opt.key" class="mb-4px">
              <ElTag size="small" class="mr-4px">{{ opt.key }}</ElTag>
              <span>{{ opt.text }}</span>
            </div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="答案" :span="2">{{ detailItem.answer }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailItem.explanation" label="解析" :span="2">
            {{ detailItem.explanation }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="分值">{{ detailItem.score }} 分</ElDescriptionsItem>
          <ElDescriptionsItem label="分类">{{ detailItem.category || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="标签" :span="2">
            <ElTag v-for="tag in detailItem.tags || []" :key="tag" class="mr-4px" size="small">{{ tag }}</ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </template>
      <template #footer>
        <ElButton @click="detailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="importVisible" title="批量导入题目" width="600px">
      <div class="mb-8px">
        <ElUpload :auto-upload="false" :show-file-list="false" accept=".json" :on-change="handleFileImport as any">
          <ElButton type="primary" plain>选择JSON文件</ElButton>
        </ElUpload>
      </div>
      <ElInput v-model="importText" type="textarea" :rows="10" placeholder="粘贴JSON数组，每个元素为题目对象" />
      <template #footer>
        <ElButton @click="importVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="importing" @click="handleImportSubmit">导入</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
