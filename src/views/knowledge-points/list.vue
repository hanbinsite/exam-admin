<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { PERMISSION_CODES } from '@/constants/permissions';
import {
  fetchCreateKnowledgePoint,
  fetchDeleteKnowledgePoint,
  fetchKnowledgePointDetail,
  fetchKnowledgePointTree,
  fetchUpdateKnowledgePoint
} from '@/service/api';
import { useExamStore } from '@/store/modules/exam';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'KnowledgePointList' });

const examStore = useExamStore();
const { hasAuth } = useAuth();
const knowledgePoints = ref<Exam.KnowledgePoint.KnowledgePoint[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增知识点');
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  subject_id: '',
  parent_id: null as number | null,
  name: '',
  description: '',
  sort_order: 0,
  is_active: true
});

const editingId = ref<number | null>(null);
const kpDetailVisible = ref(false);
const currentKPDetail = ref<Exam.KnowledgePoint.KnowledgePoint | null>(null);

const rules: FormRules = {
  name: [{ required: true, message: '请输入知识点名称', trigger: 'blur' }]
};

function resetForm() {
  form.parent_id = null;
  form.name = '';
  form.description = '';
  form.sort_order = 0;
  form.is_active = true;
  editingId.value = null;
  formRef.value?.resetFields();
}

async function loadKnowledgePoints() {
  if (!examStore.currentSubjectId) return;
  loading.value = true;
  const { data, error } = await fetchKnowledgePointTree(examStore.currentSubjectId);
  if (!error && data) {
    knowledgePoints.value = data;
  }
  loading.value = false;
}

watch(
  () => examStore.currentSubjectId,
  () => {
    loadKnowledgePoints();
  }
);

function handleAdd(parentId?: number) {
  resetForm();
  form.subject_id = examStore.currentSubjectId;
  form.parent_id = parentId || null;
  dialogTitle.value = '新增知识点';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.KnowledgePoint.KnowledgePoint) {
  editingId.value = row.id;
  form.subject_id = examStore.currentSubjectId;
  form.parent_id = row.parent_id;
  form.name = row.name;
  form.description = row.description || '';
  form.sort_order = row.sort_order;
  form.is_active = row.is_active;
  dialogTitle.value = '编辑知识点';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    form.subject_id = examStore.currentSubjectId;
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
  } finally {
    submitting.value = false;
  }
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

async function handleViewDetail(row: Exam.KnowledgePoint.KnowledgePoint) {
  const { data, error } = await fetchKnowledgePointDetail(row.id);
  if (!error && data) {
    currentKPDetail.value = data;
    kpDetailVisible.value = true;
  }
}

function flattenKP(
  kpList: Exam.KnowledgePoint.KnowledgePoint[],
  excludeId?: number | null
): Exam.KnowledgePoint.KnowledgePoint[] {
  const result: Exam.KnowledgePoint.KnowledgePoint[] = [];
  for (const kp of kpList) {
    if (kp.id !== excludeId) {
      result.push(kp);
    }
    if (kp.children && kp.children.length > 0) {
      if (kp.id !== excludeId) {
        result.push(...flattenKP(kp.children, excludeId));
      }
    }
  }
  return result;
}

onMounted(() => {
  if (examStore.subjects.length === 0) {
    examStore.loadSubjects();
  }
  if (examStore.currentSubjectId) {
    loadKnowledgePoints();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <div class="flex items-center gap-12px">
      <span class="text-16px font-medium">科目：</span>
      <ElSelect v-model="examStore.currentSubjectId" placeholder="选择科目" class="w-select">
        <ElOption v-for="s in examStore.subjects" :key="s.id" :label="s.name" :value="s.id" />
      </ElSelect>
    </div>

    <ElCard class="card-wrapper sm:flex-1-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <p>知识点管理</p>
          <ElButton
            v-if="hasAuth(PERMISSION_CODES.QUESTION_MANAGE)"
            type="primary"
            :disabled="!examStore.currentSubjectId"
            @click="handleAdd()"
          >
            新增顶级知识点
          </ElButton>
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
        <ElTableColumn label="操作" width="280" align="center">
          <template #default="{ row }">
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.QUESTION_MANAGE)"
              type="success"
              link
              size="small"
              @click="handleAdd(row.id)"
            >
              添加子节点
            </ElButton>
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
            <ElButton type="info" link size="small" @click="handleViewDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="父节点">
          <ElSelect v-model="form.parent_id" placeholder="选择父知识点" clearable>
            <ElOption
              v-for="kp in flattenKP(knowledgePoints, editingId)"
              :key="kp.id"
              :label="kp.name"
              :value="kp.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
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

    <ElDialog v-model="kpDetailVisible" title="知识点详情" width="450px">
      <template v-if="currentKPDetail">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="ID">{{ currentKPDetail.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="名称">{{ currentKPDetail.name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="描述">{{ currentKPDetail.description || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="科目">{{ currentKPDetail.subject_id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="父节点ID">{{ currentKPDetail.parent_id ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="排序">{{ currentKPDetail.sort_order }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="currentKPDetail.is_active ? 'success' : 'info'">
              {{ currentKPDetail.is_active ? '启用' : '禁用' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.w-select {
  width: 200px;
}
</style>
