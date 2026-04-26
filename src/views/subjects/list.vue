<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchCreateSubject, fetchDeleteSubject, fetchSubjectList, fetchUpdateSubject } from '@/service/api';

defineOptions({ name: 'SubjectList' });

const loading = ref(false);
const subjects = ref<Exam.Subject.Subject[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('新增科目');
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  id: '',
  name: '',
  description: '',
  category: '',
  icon: ''
});

const editingId = ref<string | null>(null);

const rules: FormRules = {
  id: [{ required: true, message: '请输入科目ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入科目名称', trigger: 'blur' }]
};

function resetForm() {
  form.id = '';
  form.name = '';
  form.description = '';
  form.category = '';
  form.icon = '';
  editingId.value = null;
  formRef.value?.resetFields();
}

async function loadSubjects() {
  loading.value = true;
  const { data, error } = await fetchSubjectList();
  if (!error && data) {
    subjects.value = data;
  }
  loading.value = false;
}

function handleAdd() {
  resetForm();
  dialogTitle.value = '新增科目';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.Subject.Subject) {
  editingId.value = row.id;
  form.id = row.id;
  form.name = row.name;
  form.description = row.description;
  form.category = row.category;
  form.icon = row.icon;
  dialogTitle.value = '编辑科目';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (editingId.value) {
      const { error } = await fetchUpdateSubject(editingId.value, {
        name: form.name,
        description: form.description,
        category: form.category,
        icon: form.icon
      });
      if (!error) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadSubjects();
      }
    } else {
      const { error } = await fetchCreateSubject({
        id: form.id,
        name: form.name,
        description: form.description,
        category: form.category,
        icon: form.icon
      });
      if (!error) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        loadSubjects();
      }
    }
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: Exam.Subject.Subject) {
  await ElMessageBox.confirm(`确定删除科目"${row.name}"？`, '确认删除', { type: 'warning' });
  const { error } = await fetchDeleteSubject(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadSubjects();
  }
}

async function handleToggleActive(row: Exam.Subject.Subject) {
  const { error } = await fetchUpdateSubject(row.id, { is_active: !row.is_active });
  if (!error) {
    ElMessage.success('状态更新成功');
    loadSubjects();
  }
}

onMounted(loadSubjects);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>科目管理</p>
          <ElButton type="primary" @click="handleAdd">新增科目</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="subjects" border stripe>
        <ElTableColumn prop="id" label="ID" width="120" />
        <ElTableColumn prop="name" label="名称" min-width="150" />
        <ElTableColumn prop="category" label="分类" width="120" />
        <ElTableColumn label="状态" width="100" align="center">
          <template #default="{ row }">
            <ElSwitch :model-value="row.is_active" @change="handleToggleActive(row)" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="题目数" width="100" align="center">
          <template #default="{ row }">{{ row.stats?.totalQuestions ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="ID" prop="id">
          <ElInput v-model="form.id" :disabled="!!editingId" placeholder="科目唯一标识" />
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" placeholder="科目名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="3" placeholder="科目描述" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElInput v-model="form.category" placeholder="科目分类" />
        </ElFormItem>
        <ElFormItem label="图标">
          <ElInput v-model="form.icon" placeholder="图标标识" />
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
