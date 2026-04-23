<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchAssignRoleMenus,
  fetchCreateMenu,
  fetchDeleteMenu,
  fetchMenuList,
  fetchRoleList,
  fetchRoleMenus,
  fetchUpdateMenu
} from '@/service/api';

defineOptions({ name: 'RbacMenus' });

const menus = ref<Exam.RBAC.Menu[]>([]);
const roles = ref<Exam.RBAC.Role[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增菜单');
const submitting = ref(false);
const assignDialogVisible = ref(false);
const currentRoleCode = ref('');
const selectedMenuIds = ref<number[]>([]);

const form = reactive({
  parent_id: null as number | null,
  name: '',
  path: '',
  icon: '',
  component: '',
  permission_code: '',
  sort_order: 0
});

const editingId = ref<number | null>(null);

function resetForm() {
  form.parent_id = null;
  form.name = '';
  form.path = '';
  form.icon = '';
  form.component = '';
  form.permission_code = '';
  form.sort_order = 0;
  editingId.value = null;
}

async function loadData() {
  loading.value = true;
  const [menusRes, rolesRes] = await Promise.all([fetchMenuList(), fetchRoleList()]);
  if (!menusRes.error && menusRes.data) menus.value = menusRes.data;
  if (!rolesRes.error && rolesRes.data) roles.value = rolesRes.data;
  loading.value = false;
}

function handleAdd() {
  resetForm();
  dialogTitle.value = '新增菜单';
  dialogVisible.value = true;
}

function handleEdit(row: Exam.RBAC.Menu) {
  editingId.value = row.id;
  form.parent_id = row.parent_id;
  form.name = row.name;
  form.path = row.path;
  form.icon = row.icon || '';
  form.component = row.component || '';
  form.permission_code = row.permission_code || '';
  form.sort_order = row.sort_order;
  dialogTitle.value = '编辑菜单';
  dialogVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  const data = {
    parent_id: form.parent_id,
    name: form.name,
    path: form.path,
    icon: form.icon,
    component: form.component,
    permission_code: form.permission_code,
    sort_order: form.sort_order
  };
  if (editingId.value) {
    const { error } = await fetchUpdateMenu(editingId.value, data);
    if (!error) {
      ElMessage.success('更新成功');
      dialogVisible.value = false;
      loadData();
    }
  } else {
    const { error } = await fetchCreateMenu(data);
    if (!error) {
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      loadData();
    }
  }
  submitting.value = false;
}

async function handleDelete(row: Exam.RBAC.Menu) {
  await ElMessageBox.confirm(`确定删除菜单「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  });
  const { error } = await fetchDeleteMenu(row.id);
  if (!error) {
    ElMessage.success('删除成功');
    loadData();
  }
}

async function handleAssignDialog(role: Exam.RBAC.Role) {
  currentRoleCode.value = role.code;
  const { data, error } = await fetchRoleMenus(role.code);
  if (!error && data) {
    selectedMenuIds.value = data.map(m => m.id);
  } else {
    selectedMenuIds.value = [];
  }
  assignDialogVisible.value = true;
}

async function handleAssignSubmit() {
  const { error } = await fetchAssignRoleMenus(currentRoleCode.value, selectedMenuIds.value);
  if (!error) {
    ElMessage.success('菜单分配成功');
    assignDialogVisible.value = false;
  }
}

function flattenMenus(menuList: Exam.RBAC.Menu[]): Exam.RBAC.Menu[] {
  const result: Exam.RBAC.Menu[] = [];
  for (const menu of menuList) {
    result.push(menu);
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children));
    }
  }
  return result;
}

onMounted(loadData);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p>菜单管理</p>
          <ElButton type="primary" @click="handleAdd">新增菜单</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="menus" border stripe row-key="id" default-expand-all>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="菜单名称" min-width="150" />
        <ElTableColumn prop="path" label="路径" min-width="200" />
        <ElTableColumn prop="icon" label="图标" width="120" />
        <ElTableColumn prop="component" label="组件" min-width="150" />
        <ElTableColumn prop="permission_code" label="权限码" width="150" />
        <ElTableColumn prop="sort_order" label="排序" width="80" align="center" />
        <ElTableColumn label="操作" width="150" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p>角色菜单分配</p>
        </div>
      </template>
      <ElTable :data="roles" border stripe>
        <ElTableColumn prop="code" label="角色代码" width="150" />
        <ElTableColumn prop="name" label="角色名称" min-width="150" />
        <ElTableColumn prop="is_super" label="超级角色" width="100" align="center">
          <template #default="{ row }">
            <ElTag v-if="row.is_super" type="success">是</ElTag>
            <ElTag v-else type="info">否</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="150" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" :disabled="row.is_super" @click="handleAssignDialog(row)">
              分配菜单
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="父菜单">
          <ElSelect v-model="form.parent_id" placeholder="选择父菜单" clearable>
            <ElOption v-for="m in flattenMenus(menus)" :key="m.id" :label="m.name" :value="m.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="名称" required>
          <ElInput v-model="form.name" placeholder="菜单名称" />
        </ElFormItem>
        <ElFormItem label="路径" required>
          <ElInput v-model="form.path" placeholder="/path" />
        </ElFormItem>
        <ElFormItem label="图标">
          <ElInput v-model="form.icon" placeholder="icon-name" />
        </ElFormItem>
        <ElFormItem label="组件">
          <ElInput v-model="form.component" placeholder="component path" />
        </ElFormItem>
        <ElFormItem label="权限码">
          <ElInput v-model="form.permission_code" placeholder="permission:code" />
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

    <ElDialog v-model="assignDialogVisible" title="分配菜单" width="500px">
      <ElCheckboxGroup v-model="selectedMenuIds">
        <ElCheckbox v-for="m in flattenMenus(menus)" :key="m.id" :value="m.id" class="mb-8px w-full">
          {{ m.name }} ({{ m.path }})
        </ElCheckbox>
      </ElCheckboxGroup>
      <template #footer>
        <ElButton @click="assignDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleAssignSubmit">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
