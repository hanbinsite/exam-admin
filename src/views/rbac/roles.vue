<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { PERMISSION_CODES } from '@/constants/permissions';
import {
  fetchAssignRoleMenus,
  fetchAssignRolePermissions,
  fetchCreateRole,
  fetchDeleteRole,
  fetchMenuList,
  fetchPermissionList,
  fetchRoleList,
  fetchRoleMenus,
  fetchRolePermissions,
  fetchUpdateRole
} from '@/service/api';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'RbacRoles' });

const { hasAuth } = useAuth();

const roles = ref<Exam.RBAC.Role[]>([]);
const permissions = ref<Exam.RBAC.Permission[]>([]);
const menus = ref<Exam.RBAC.Menu[]>([]);
const menuTreeData = computed(() => {
  const transform = (list: Exam.RBAC.Menu[]): any[] =>
    list.map(m => ({
      id: m.id,
      title: m.meta.title,
      children: m.children ? transform(m.children) : []
    }));
  return transform(menus.value);
});
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增角色');
const submitting = ref(false);
const permDialogVisible = ref(false);
const permSubmitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  name: '',
  code: '',
  description: '',
  is_super: false
});

const editingId = ref<number | null>(null);
const currentRoleCode = ref('');
const checkedPermissions = ref<string[]>([]);
const menuDialogVisible = ref(false);
const menuSubmitting = ref(false);
const checkedMenuIds = ref<number[]>([]);
const currentRoleCodeForMenu = ref('');

const rules: FormRules = {
  code: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
};

async function loadRoles() {
  loading.value = true;
  const [rolesRes, permsRes, menusRes] = await Promise.all([
    fetchRoleList(true),
    fetchPermissionList(),
    fetchMenuList()
  ]);
  if (!rolesRes.error && rolesRes.data) roles.value = rolesRes.data;
  if (!permsRes.error && permsRes.data) permissions.value = permsRes.data;
  if (!menusRes.error && menusRes.data) menus.value = menusRes.data;
  loading.value = false;
}

function handleAdd() {
  form.name = '';
  form.code = '';
  form.description = '';
  form.is_super = false;
  editingId.value = null;
  dialogTitle.value = '新增角色';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.RBAC.Role) {
  editingId.value = row.id;
  form.name = row.name;
  form.code = row.code;
  form.description = row.description || '';
  form.is_super = row.is_super;
  dialogTitle.value = '编辑角色';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.is_super) {
    try {
      await ElMessageBox.confirm('设为超级管理员将绕过所有权限检查，确认？', '警告', { type: 'warning' });
    } catch {
      return;
    }
  }
  submitting.value = true;
  try {
    if (editingId.value) {
      const { error } = await fetchUpdateRole(editingId.value, form);
      if (!error) {
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        loadRoles();
      }
    } else {
      const { error } = await fetchCreateRole(form);
      if (!error) {
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        loadRoles();
      }
    }
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: Exam.RBAC.Role) {
  if (row.is_super) {
    ElMessage.warning('超级管理员角色不可删除');
    return;
  }
  await ElMessageBox.confirm(`确定删除角色"${row.name}"？`, '确认删除', { type: 'warning' });
  const { error } = await fetchDeleteRole(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadRoles();
  }
}

async function handlePermissionAssign(row: Exam.RBAC.Role) {
  currentRoleCode.value = row.code;
  const { data, error } = await fetchRolePermissions(row.code);
  if (!error && data) {
    checkedPermissions.value = data.map(p => p.code);
  } else {
    checkedPermissions.value = [];
  }
  permDialogVisible.value = true;
}

async function handlePermSubmit() {
  permSubmitting.value = true;
  try {
    const { error } = await fetchAssignRolePermissions(currentRoleCode.value, checkedPermissions.value);
    if (!error) {
      ElMessage.success('权限分配成功');
      permDialogVisible.value = false;
    }
  } finally {
    permSubmitting.value = false;
  }
}

async function handleMenuAssign(row: Exam.RBAC.Role) {
  currentRoleCodeForMenu.value = row.code;
  const { data, error } = await fetchRoleMenus(row.code);
  if (!error && data) {
    checkedMenuIds.value = data.map(m => m.id);
  } else {
    checkedMenuIds.value = [];
  }
  menuDialogVisible.value = true;
}

async function handleMenuSubmit() {
  menuSubmitting.value = true;
  try {
    const { error } = await fetchAssignRoleMenus(currentRoleCodeForMenu.value, checkedMenuIds.value);
    if (!error) {
      ElMessage.success('菜单分配成功');
      menuDialogVisible.value = false;
    }
  } finally {
    menuSubmitting.value = false;
  }
}

onMounted(loadRoles);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p>角色管理</p>
          <ElButton v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)" type="primary" @click="handleAdd">新增角色</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="roles" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="code" label="标识" width="150" />
        <ElTableColumn prop="name" label="名称" min-width="150" />
        <ElTableColumn prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <ElTableColumn label="超管" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.is_super ? 'danger' : 'info'">{{ row.is_super ? '是' : '否' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="激活" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.is_active ? 'success' : 'warning'">{{ row.is_active ? '是' : '否' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="310" align="center">
          <template #default="{ row }">
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="warning"
              link
              size="small"
              @click="handlePermissionAssign(row)"
            >
              权限
            </ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
              type="success"
              link
              size="small"
              @click="handleMenuAssign(row)"
            >
              菜单
            </ElButton>
            <ElButton
              v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)"
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
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="450px">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="标识" prop="code">
          <ElInput v-model="form.code" :disabled="!!editingId" placeholder="如 admin" />
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" placeholder="如 管理员" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" />
        </ElFormItem>
        <ElFormItem label="超管">
          <ElSwitch v-model="form.is_super" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="permDialogVisible" title="分配权限" width="500px">
      <ElCheckboxGroup v-model="checkedPermissions">
        <ElCheckbox v-for="p in permissions" :key="p.code" :value="p.code" class="mb-8px w-full">
          {{ p.name }} ({{ p.code }})
        </ElCheckbox>
      </ElCheckboxGroup>
      <template #footer>
        <ElButton @click="permDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="permSubmitting" @click="handlePermSubmit">提交</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="menuDialogVisible" title="分配菜单" width="500px">
      <ElTree
        :data="menuTreeData"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedMenuIds"
        :props="{ label: 'title', children: 'children' }"
        @check="
          (_node: any, checked: { checkedKeys: number[] }) => {
            checkedMenuIds = checked.checkedKeys;
          }
        "
      />
      <template #footer>
        <ElButton @click="menuDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="menuSubmitting" @click="handleMenuSubmit">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
