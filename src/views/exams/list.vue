<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchCreateExam, fetchDeleteExam, fetchExamList, fetchQuestionTypeList, fetchUpdateExam } from '@/service/api';
import { useExamStore } from '@/store/modules/exam';

defineOptions({ name: 'ExamList' });

const router = useRouter();
const examStore = useExamStore();
const exams = ref<Exam.ExamModule.ExamConfig[]>([]);
const questionTypes = ref<Exam.QuestionType.QuestionType[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增考试');
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<Exam.ExamModule.ExamCreateRequest>({
  subject_id: '',
  name: '',
  description: '',
  duration: 120,
  question_rules: {},
  scoring_rules: {},
  is_active: true
});

const editingId = ref<number | null>(null);

const rules: FormRules = {
  name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }]
};

interface QuestionRuleRow {
  type_id: string;
  count: number;
  random: boolean;
  fixed_ids: string;
}

const ruleRows = ref<QuestionRuleRow[]>([]);
const scoringRows = ref<{ type_id: string; score: number }[]>([]);

function resetForm() {
  form.name = '';
  form.description = '';
  form.duration = 120;
  form.question_rules = {};
  form.scoring_rules = {};
  form.is_active = true;
  editingId.value = null;
  ruleRows.value = [];
  scoringRows.value = [];
  formRef.value?.resetFields();
}

function addRuleRow() {
  ruleRows.value.push({ type_id: '', count: 10, random: true, fixed_ids: '' });
}

function removeRuleRow(index: number) {
  ruleRows.value.splice(index, 1);
}

function addScoringRow() {
  scoringRows.value.push({ type_id: '', score: 2 });
}

function removeScoringRow(index: number) {
  scoringRows.value.splice(index, 1);
}

function buildQuestionRules() {
  const result: Record<string, Exam.ExamModule.QuestionRule> = {};
  for (const row of ruleRows.value) {
    if (row.type_id) {
      const rule: Exam.ExamModule.QuestionRule = { count: row.count, random: row.random };
      if (!row.random && row.fixed_ids) {
        rule.fixed_ids = row.fixed_ids
          .split(',')
          .map(id => Number(id.trim()))
          .filter(id => !Number.isNaN(id));
      }
      result[row.type_id] = rule;
    }
  }
  form.question_rules = result;
}

function buildScoringRules() {
  const result: Record<string, number> = {};
  for (const row of scoringRows.value) {
    if (row.type_id) {
      result[row.type_id] = row.score;
    }
  }
  form.scoring_rules = result;
}

function parseQuestionRules(qRules: Record<string, Exam.ExamModule.QuestionRule>) {
  ruleRows.value = Object.entries(qRules || {}).map(([typeId, rule]) => ({
    type_id: typeId,
    count: rule.count,
    random: rule.random ?? true,
    fixed_ids: rule.fixed_ids?.join(', ') || ''
  }));
}

function parseScoringRules(sRules: Record<string, number>) {
  scoringRows.value = Object.entries(sRules || {}).map(([typeId, score]) => ({
    type_id: typeId,
    score
  }));
}

async function loadExams() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const [examsRes, typesRes] = await Promise.all([
    fetchExamList(examStore.currentSubjectId),
    fetchQuestionTypeList(examStore.currentSubjectId)
  ]);
  if (!examsRes.error && examsRes.data) {
    exams.value = examsRes.data;
  }
  if (!typesRes.error && typesRes.data) {
    questionTypes.value = typesRes.data;
  }
  loading.value = false;
}

watch(
  () => examStore.currentSubjectId,
  () => {
    loadExams();
  }
);

function handleAdd() {
  resetForm();
  dialogTitle.value = '新增考试';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.ExamModule.ExamConfig) {
  editingId.value = row.id;
  form.subject_id = row.subject_id;
  form.name = row.name;
  form.description = row.description || '';
  form.duration = row.duration;
  form.is_active = row.is_active;
  parseQuestionRules(row.question_rules);
  parseScoringRules(row.scoring_rules);
  dialogTitle.value = '编辑考试';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  buildQuestionRules();
  buildScoringRules();
  submitting.value = true;
  try {
    form.subject_id = examStore.currentSubjectId;
    if (editingId.value) {
      const { error } = await fetchUpdateExam(editingId.value, form);
      if (!error) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadExams();
      }
    } else {
      const { error } = await fetchCreateExam(form);
      if (!error) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        loadExams();
      }
    }
  } finally {
    submitting.value = false;
  }
}

async function handleToggleActive(row: Exam.ExamModule.ExamConfig) {
  const { error } = await fetchUpdateExam(row.id, { is_active: !row.is_active });
  if (!error) {
    ElMessage.success('状态更新成功');
    loadExams();
  }
}

async function handleDelete(row: Exam.ExamModule.ExamConfig) {
  await ElMessageBox.confirm(`确定删除考试「${row.name}」吗？删除后将被停用。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  });
  const { error } = await fetchDeleteExam(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadExams();
  }
}

function handleViewSessions(row: Exam.ExamModule.ExamConfig) {
  router.push({ path: '/exams/sessions', query: { subjectId: examStore.currentSubjectId, examId: String(row.id) } });
}

onMounted(() => {
  if (examStore.subjects.length === 0) {
    examStore.loadSubjects();
  }
  if (examStore.currentSubjectId) {
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
    </div>

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>考试配置</p>
          <ElButton type="primary" :disabled="!examStore.currentSubjectId" @click="handleAdd">新增考试</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="exams" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="考试名称" min-width="200" />
        <ElTableColumn prop="duration" label="时长(分钟)" width="120" align="center" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElSwitch :model-value="row.is_active" @change="handleToggleActive(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="240" align="center">
          <template #default="{ row }">
            <ElButton type="info" link size="small" @click="handleViewSessions(row)">场次</ElButton>
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="750px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="考试名称" prop="name">
          <ElInput v-model="form.name" placeholder="考试名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" placeholder="考试描述" />
        </ElFormItem>
        <ElFormItem label="时长(分钟)">
          <ElInputNumber v-model="form.duration" :min="1" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="form.is_active" />
        </ElFormItem>

        <ElDivider content-position="left">抽题规则</ElDivider>
        <div v-for="(row, idx) in ruleRows" :key="idx" class="mb-8px flex items-center gap-8px">
          <ElSelect v-model="row.type_id" placeholder="题型" style="width: 150px">
            <ElOption v-for="t in questionTypes" :key="t.id" :label="t.display_name" :value="String(t.id)" />
          </ElSelect>
          <ElInputNumber v-model="row.count" :min="1" placeholder="数量" style="width: 120px" />
          <ElSelect v-model="row.random" style="width: 100px">
            <ElOption :value="true" label="随机" />
            <ElOption :value="false" label="固定" />
          </ElSelect>
          <ElInput v-if="!row.random" v-model="row.fixed_ids" placeholder="固定题目ID，逗号分隔" class="flex-1" />
          <ElButton type="danger" link @click="removeRuleRow(idx)">删除</ElButton>
        </div>
        <ElButton type="primary" link @click="addRuleRow">+ 添加抽题规则</ElButton>

        <ElDivider content-position="left">评分规则</ElDivider>
        <div v-for="(row, idx) in scoringRows" :key="idx" class="mb-8px flex items-center gap-8px">
          <ElSelect v-model="row.type_id" placeholder="题型" style="width: 150px">
            <ElOption v-for="t in questionTypes" :key="t.id" :label="t.display_name" :value="String(t.id)" />
          </ElSelect>
          <ElInputNumber v-model="row.score" :min="0.5" :step="0.5" placeholder="每题分值" style="width: 120px" />
          <span class="text-gray-500">分/题</span>
          <ElButton type="danger" link @click="removeScoringRow(idx)">删除</ElButton>
        </div>
        <ElButton type="primary" link @click="addScoringRow">+ 添加评分规则</ElButton>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
