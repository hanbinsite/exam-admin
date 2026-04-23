<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreateMaterial,
  fetchDeleteMaterial,
  fetchMaterialList,
  fetchSubjectList,
  fetchUpdateMaterial
} from '@/service/api';

defineOptions({ name: 'MaterialList' });

const subjects = ref<Exam.Subject.Subject[]>([]);
const currentSubjectId = ref('');
const materials = ref<Exam.Material.Material[]>([]);
const loading = ref(false);
const activeTab = ref<Exam.Material.MaterialType>('guide');
const dialogVisible = ref(false);
const dialogTitle = ref('新增资料');
const submitting = ref(false);

const form = reactive<Exam.Material.MaterialCreateRequest>({
  subject_id: '',
  type: 'guide',
  title: '',
  content: '',
  meta: undefined,
  summary: '',
  tags: [],
  sort_order: 0
});

const editingId = ref<number | null>(null);

const typeLabels: Record<Exam.Material.MaterialType, string> = {
  guide: '实操指南',
  practice_task: '实操任务',
  case_analysis: '案例分析'
};

function resetForm() {
  form.title = '';
  form.content = '';
  form.meta = undefined;
  form.summary = '';
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

async function loadMaterials() {
  if (!currentSubjectId.value) return;
  loading.value = true;
  const { data, error } = await fetchMaterialList(currentSubjectId.value, activeTab.value);
  if (!error && data) {
    materials.value = data;
  }
  loading.value = false;
}

watch([currentSubjectId, activeTab], () => {
  loadMaterials();
});

function handleAdd() {
  resetForm();
  form.subject_id = currentSubjectId.value;
  form.type = activeTab.value;
  dialogTitle.value = `新增${typeLabels[activeTab.value]}`;
  dialogVisible.value = true;
}

function handleEdit(row: Exam.Material.Material) {
  editingId.value = row.id;
  form.subject_id = row.subject_id;
  form.type = row.type;
  form.title = row.title;
  form.content = row.content;
  form.meta = row.meta;
  form.summary = row.summary || '';
  form.tags = row.tags || [];
  form.sort_order = row.sort_order;
  dialogTitle.value = `编辑${typeLabels[row.type]}`;
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  form.subject_id = currentSubjectId.value;
  if (editingId.value) {
    const { error } = await fetchUpdateMaterial(editingId.value, form);
    if (!error) {
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      loadMaterials();
    }
  } else {
    const { error } = await fetchCreateMaterial(form);
    if (!error) {
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      loadMaterials();
    }
  }
  submitting.value = false;
}

async function handleDelete(row: Exam.Material.Material) {
  await ElMessageBox.confirm(`确定删除"${row.title}"？`, '确认删除', { type: 'warning' });
  const { error } = await fetchDeleteMaterial(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadMaterials();
  }
}

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

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <ElTabs v-model="activeTab">
            <ElTabPane label="实操指南" name="guide" />
            <ElTabPane label="实操任务" name="practice_task" />
            <ElTabPane label="案例分析" name="case_analysis" />
          </ElTabs>
          <ElButton type="primary" :disabled="!currentSubjectId" @click="handleAdd">
            新增{{ typeLabels[activeTab] }}
          </ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="materials" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="title" label="标题" min-width="200" />
        <ElTableColumn prop="summary" label="摘要" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="标签" width="200">
          <template #default="{ row }">
            <ElTag v-for="tag in row.tags || []" :key="tag" class="mr-4px" size="small">{{ tag }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="sort_order" label="排序" width="80" align="center" />
        <ElTableColumn label="操作" width="180" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="标题" required>
          <ElInput v-model="form.title" placeholder="资料标题" />
        </ElFormItem>
        <ElFormItem label="内容" required>
          <ElInput v-model="form.content" type="textarea" :rows="8" placeholder="资料内容" />
        </ElFormItem>
        <ElFormItem label="摘要">
          <ElInput v-model="form.summary" type="textarea" :rows="2" placeholder="简要描述" />
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
