<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  fetchCreateQuestionType,
  fetchDeleteQuestionType,
  fetchQuestionTypeList,
  fetchUpdateQuestionType
} from '@/service/api';
import { useExamStore } from '@/store/modules/exam';

defineOptions({ name: 'QuestionTypeList' });

const examStore = useExamStore();
const questionTypes = ref<Exam.QuestionType.QuestionType[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增题型');
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  subject_id: '',
  name: '',
  display_name: '',
  has_options: false,
  has_sub_questions: false,
  scoring_type: 'auto' as 'auto' | 'mixed',
  default_score: 1,
  sort_order: 0
});

const editingId = ref<number | null>(null);

const rules: FormRules = {
  name: [{ required: true, message: '请输入题型标识', trigger: 'blur' }],
  display_name: [{ required: true, message: '请输入显示名称', trigger: 'blur' }]
};

function resetForm() {
  form.name = '';
  form.display_name = '';
  form.has_options = false;
  form.has_sub_questions = false;
  form.scoring_type = 'auto';
  form.default_score = 1;
  form.sort_order = 0;
  editingId.value = null;
  formRef.value?.resetFields();
}

async function loadQuestionTypes() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const { data, error } = await fetchQuestionTypeList(examStore.currentSubjectId);
  if (!error && data) {
    questionTypes.value = data;
  }
  loading.value = false;
}

watch(
  () => examStore.currentSubjectId,
  () => {
    loadQuestionTypes();
  }
);

function handleAdd() {
  resetForm();
  form.subject_id = examStore.currentSubjectId;
  dialogTitle.value = '新增题型';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.QuestionType.QuestionType) {
  editingId.value = row.id;
  form.subject_id = row.subject_id;
  form.name = row.name;
  form.display_name = row.display_name;
  form.has_options = row.has_options;
  form.has_sub_questions = row.has_sub_questions;
  form.scoring_type = row.scoring_type;
  form.default_score = row.default_score;
  form.sort_order = row.sort_order;
  dialogTitle.value = '编辑题型';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (editingId.value) {
      const { error } = await fetchUpdateQuestionType(editingId.value, {
        subject_id: form.subject_id,
        name: form.name,
        display_name: form.display_name,
        has_options: form.has_options,
        has_sub_questions: form.has_sub_questions,
        scoring_type: form.scoring_type,
        default_score: form.default_score,
        sort_order: form.sort_order
      });
      if (!error) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadQuestionTypes();
      }
    } else {
      const { error } = await fetchCreateQuestionType(form);
      if (!error) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        loadQuestionTypes();
      }
    }
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: Exam.QuestionType.QuestionType) {
  await ElMessageBox.confirm(`确定删除题型"${row.display_name}"？`, '确认删除', { type: 'warning' });
  const { error } = await fetchDeleteQuestionType(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadQuestionTypes();
  }
}

onMounted(() => {
  if (examStore.subjects.length === 0) {
    examStore.loadSubjects();
  }
  if (examStore.currentSubjectId) {
    loadQuestionTypes();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard>
      <div class="mb-16px flex items-center gap-12px">
        <span class="text-16px font-medium">科目：</span>
        <ElSelect v-model="examStore.currentSubjectId" placeholder="选择科目" style="width: 200px">
          <ElOption v-for="s in examStore.subjects" :key="s.id" :label="s.name" :value="s.id" />
        </ElSelect>
        <ElButton type="primary" class="ml-auto" :disabled="!examStore.currentSubjectId" @click="handleAdd">
          新增题型
        </ElButton>
      </div>
      <ElTable v-loading="loading" :data="questionTypes" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="display_name" label="显示名称" min-width="120" />
        <ElTableColumn prop="name" label="标识" width="140" />
        <ElTableColumn label="有选项" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.has_options ? 'success' : 'info'">{{ row.has_options ? '是' : '否' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="有子题" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.has_sub_questions ? 'success' : 'info'">{{ row.has_sub_questions ? '是' : '否' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="scoring_type" label="评分类型" width="100" />
        <ElTableColumn prop="default_score" label="默认分值" width="100" align="center" />
        <ElTableColumn prop="sort_order" label="排序" width="80" align="center" />
        <ElTableColumn label="操作" width="180" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="标识" prop="name">
          <ElInput v-model="form.name" placeholder="如 choice, multi_choice" />
        </ElFormItem>
        <ElFormItem label="显示名称" prop="display_name">
          <ElInput v-model="form.display_name" placeholder="如 单选题" />
        </ElFormItem>
        <ElFormItem label="有选项">
          <ElSwitch v-model="form.has_options" />
        </ElFormItem>
        <ElFormItem label="有子题">
          <ElSwitch v-model="form.has_sub_questions" />
        </ElFormItem>
        <ElFormItem label="评分类型">
          <ElSelect v-model="form.scoring_type">
            <ElOption label="自动" value="auto" />
            <ElOption label="混合" value="mixed" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="默认分值">
          <ElInputNumber v-model="form.default_score" :min="0.5" :step="0.5" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort_order" :min="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
