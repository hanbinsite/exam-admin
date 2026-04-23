<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreateKnowledgePoint,
  fetchDeleteKnowledgePoint,
  fetchKnowledgePointTree,
  fetchSubjectList,
  fetchUpdateKnowledgePoint
} from '@/service/api';

defineOptions({ name: 'KnowledgePointList' });

const subjects = ref<Exam.Subject.Subject[]>([]);
const currentSubjectId = ref('');
const knowledgePoints = ref<Exam.KnowledgePoint.KnowledgePoint[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增知识点');
const submitting = ref(false);

const form = reactive({
  subject_id: '',
  parent_id: null as number | null,
  name: '',
  description: '',
  sort_order: 0,
  is_active: true
});

const editingId = ref<number | null>(null);

function resetForm() {
  form.parent_id = null;
  form.name = '';
  form.description = '';
  form.sort_order = 0;
  form.is_active = true;
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

async function loadKnowledgePoints() {
  if (!currentSubjectId.value) return;
  loading.value = true;
  const { data, error } = await fetchKnowledgePointTree(currentSubjectId.value);
  if (!error && data) {
    knowledgePoints.value = data;
  }
  loading.value = false;
}

watch(currentSubjectId, () => {
  loadKnowledgePoints();
});

function handleAdd(parentId?: number) {
  resetForm();
  form.subject_id = currentSubjectId.value;
  form.parent_id = parentId || null;
  dialogTitle.value = '新增知识点';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.KnowledgePoint.KnowledgePoint) {
  editingId.value = row.id;
  form.subject_id = currentSubjectId.value;
  form.parent_id = row.parent_id;
  form.name = row.name;
  form.description = row.description || '';
  form.sort_order = row.sort_order;
  form.is_active = row.is_active;
  dialogTitle.value = '编辑知识点';
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  form.subject_id = currentSubjectId.value;
  if (editingId.value) {
    const { error } = await fetchUpdateKnowledgePoint(editingId.value, form);
    if (!error) {
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      loadKnowledgePoints();
    }
  } else {
    const { error } = await fetchCreateKnowledgePoint(form);
    if (!error) {
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      loadKnowledgePoints();
    }
  }
  submitting.value = false;
}

async function handleDelete(row: Exam.KnowledgePoint.KnowledgePoint) {
  await ElMessageBox.confirm(`确定删除知识点「${row.name}」吗？如果有子知识点或关联题目，将无法删除。`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  });
  const { error } = await fetchDeleteKnowledgePoint(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadKnowledgePoints();
  }
}

function flattenKP(kpList: Exam.KnowledgePoint.KnowledgePoint[]): Exam.KnowledgePoint.KnowledgePoint[] {
  const result: Exam.KnowledgePoint.KnowledgePoint[] = [];
  for (const kp of kpList) {
    result.push(kp);
    if (kp.children && kp.children.length > 0) {
      result.push(...flattenKP(kp.children));
    }
  }
  return result;
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
          <p>知识点管理</p>
          <ElButton type="primary" :disabled="!currentSubjectId" @click="handleAdd()">新增顶级知识点</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="knowledgePoints" border stripe row-key="id" default-expand-all>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="知识点名称" min-width="200" />
        <ElTableColumn prop="description" label="描述" min-width="200" />
        <ElTableColumn prop="sort_order" label="排序" width="80" align="center" />
        <ElTableColumn label="状态" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220" align="center">
          <template #default="{ row }">
            <ElButton type="success" link size="small" @click="handleAdd(row.id)">添加子节点</ElButton>
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="父节点">
          <ElSelect v-model="form.parent_id" placeholder="选择父知识点" clearable>
            <ElOption v-for="kp in flattenKP(knowledgePoints)" :key="kp.id" :label="kp.name" :value="kp.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="名称" required>
          <ElInput v-model="form.name" placeholder="知识点名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" placeholder="知识点描述" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort_order" :min="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.is_active" />
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
