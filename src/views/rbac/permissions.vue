<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchCreatePermission,
  fetchDeletePermission,
  fetchPermissionList,
  fetchUpdatePermission
} from '@/service/api';

defineOptions({ name: 'RbacPermissions' });

const permissions = ref<Exam.RBAC.Permission[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增权限');
const submitting = ref(false);

const form = reactive({
  code: '',
  name: '',
  description: ''
});

const editingId = ref<number | null>(null);

function resetForm() {
  form.code = '';
  form.name = '';
  form.description = '';
  editingId.value = null;
}

async function loadPermissions() {
  loading.value = true;
  const { data, error } = await fetchPermissionList();
  if (!error && data) {
    permissions.value = data;
  }
  loading.value = false;
}

function handleAdd() {
  resetForm();
  dialogTitle.value = '新增权限';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.RBAC.Permission) {
  editingId.value = row.id;
  form.code = row.code;
  form.name = row.name;
  form.description = row.description || '';
  dialogTitle.value = '编辑权限';
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  if (editingId.value) {
    const { error } = await fetchUpdatePermission(editingId.value, form);
    if (!error) {
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      loadPermissions();
    }
  } else {
    const { error } = await fetchCreatePermission(form);
    if (!error) {
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      loadPermissions();
    }
  }
  submitting.value = false;
}

async function handleDelete(row: Exam.RBAC.Permission) {
  await ElMessageBox.confirm(`确定删除权限"${row.name}"？`, '确认删除', { type: 'warning' });
  const { error } = await fetchDeletePermission(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadPermissions();
  }
}

onMounted(loadPermissions);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p>权限管理</p>
          <ElButton type="primary" @click="handleAdd">新增权限</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="permissions" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="code" label="权限标识" width="200" />
        <ElTableColumn prop="name" label="名称" min-width="150" />
        <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="操作" width="180" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="450px" @close="resetForm">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="标识" required>
          <ElInput v-model="form.code" placeholder="如 subject:manage" />
        </ElFormItem>
        <ElFormItem label="名称" required>
          <ElInput v-model="form.name" placeholder="如 科目管理" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" />
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
