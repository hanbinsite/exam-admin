<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchCreateExam, fetchDeleteExam, fetchExamList, fetchUpdateExam } from '@/service/api';
import { useExamStore } from '@/store/modules/exam';

defineOptions({ name: 'ExamList' });

const router = useRouter();
const examStore = useExamStore();
const exams = ref<Exam.ExamModule.ExamConfig[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增考试');
const submitting = ref(false);

const form = reactive<Exam.ExamModule.ExamCreateRequest>({
  subject_id: '',
  name: '',
  description: '',
  duration: 120,
  question_rules: {},
  scoring_rules: {}
});

const editingId = ref<number | null>(null);

function resetForm() {
  form.name = '';
  form.description = '';
  form.duration = 120;
  form.question_rules = {};
  form.scoring_rules = {};
  editingId.value = null;
}

async function loadExams() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const { data, error } = await fetchExamList(examStore.currentSubjectId);
  if (!error && data) {
    exams.value = data;
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
  form.question_rules = { ...row.question_rules };
  form.scoring_rules = { ...row.scoring_rules };
  dialogTitle.value = '编辑考试';
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
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
  submitting.value = false;
}

async function handleToggleActive(row: Exam.ExamModule.ExamConfig) {
  const { error } = await fetchUpdateExam(row.id, { is_active: !row.is_active });
  if (!error) {
    ElMessage.success('状态更新成功');
    loadExams();
  }
}

async function handleDelete(row: Exam.ExamModule.ExamConfig) {
  await ElMessageBox.confirm(`确定删除考试「${row.name}」吗？删除后将无法恢复。`, '删除确认', {
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="考试名称" required>
          <ElInput v-model="form.name" placeholder="考试名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" placeholder="考试描述" />
        </ElFormItem>
        <ElFormItem label="时长(分钟)">
          <ElInputNumber v-model="form.duration" :min="1" />
        </ElFormItem>
        <ElFormItem label="抽题规则">
          <ElInput
            :model-value="JSON.stringify(form.question_rules, null, 2)"
            type="textarea"
            :rows="4"
            placeholder='{"type_id": {"count": 50, "random": true}}'
            @update:model-value="
              (val: string) => {
                try {
                  form.question_rules = JSON.parse(val);
                } catch {}
              }
            "
          />
        </ElFormItem>
        <ElFormItem label="评分规则">
          <ElInput
            :model-value="JSON.stringify(form.scoring_rules, null, 2)"
            type="textarea"
            :rows="4"
            placeholder='{"type_id": 2}'
            @update:model-value="
              (val: string) => {
                try {
                  form.scoring_rules = JSON.parse(val);
                } catch {}
              }
            "
          />
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
