<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { PERMISSION_CODES } from '@/constants/permissions';
import { fetchCreateMenu, fetchDeleteMenu, fetchMenuList, fetchRbacInit, fetchUpdateMenu } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';

defineOptions({ name: 'RbacMenus' });

const { hasAuth } = useAuth();

const menus = ref<Exam.RBAC.Menu[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增菜单');
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  parent_id: null as number | null,
  name: '',
  route_key: '',
  path: '',
  icon: '',
  component: '',
  permission_code: '',
  i18n_key: '',
  hide_in_menu: false,
  is_visible: true,
  is_active: true,
  sort_order: 0
});

const editingId = ref<number | null>(null);

const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }]
};

function resetForm() {
  form.parent_id = null;
  form.name = '';
  form.route_key = '';
  form.path = '';
  form.icon = '';
  form.component = '';
  form.permission_code = '';
  form.i18n_key = '';
  form.hide_in_menu = false;
  form.is_visible = true;
  form.is_active = true;
  form.sort_order = 0;
  editingId.value = null;
  formRef.value?.resetFields();
}

async function loadData() {
  loading.value = true;
  const { data, error } = await fetchMenuList();
  if (!error && data) menus.value = data;
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
  form.route_key = row.route_key || '';
  form.path = row.path;
  form.icon = row.icon || '';
  form.component = row.component || '';
  form.permission_code = row.permission_code || '';
  form.i18n_key = row.i18n_key || '';
  form.hide_in_menu = row.hide_in_menu;
  form.is_visible = row.is_visible;
  form.is_active = row.is_active;
  form.sort_order = row.sort_order;
  dialogTitle.value = '编辑菜单';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const data: Exam.RBAC.MenuCreateRequest = {
      parent_id: form.parent_id,
      name: form.name,
      route_key: form.route_key,
      path: form.path,
      icon: form.icon,
      component: form.component || null,
      permission_code: form.permission_code,
      i18n_key: form.i18n_key,
      hide_in_menu: form.hide_in_menu,
      is_visible: form.is_visible,
      is_active: form.is_active,
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
  } finally {
    submitting.value = false;
  }
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

async function handleRbacInit() {
  try {
    await ElMessageBox.confirm('确定初始化RBAC？将创建9个内置权限和3个内置角色。', 'RBAC初始化', { type: 'warning' });
  } catch {
    return;
  }
  const { data, error } = await fetchRbacInit();
  if (!error && data) {
    ElMessage.success(`初始化成功：创建 ${data.permissions_created} 个权限，${data.roles_created} 个角色`);
    loadData();
  }
}

function flattenMenusWithIndent(
  menuList: Exam.RBAC.Menu[],
  indent = 0,
  excludeId?: number | null
): { id: number; name: string; path: string; indent: number }[] {
  const result: { id: number; name: string; path: string; indent: number }[] = [];
  for (const menu of menuList) {
    if (menu.id !== excludeId) {
      result.push({ id: menu.id, name: menu.name, path: menu.path, indent });
    }
    if (menu.children && menu.children.length > 0 && menu.id !== excludeId) {
      result.push(...flattenMenusWithIndent(menu.children, indent + 1, excludeId));
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
          <div class="flex gap-8px">
            <ElButton v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)" @click="handleRbacInit">初始化RBAC</ElButton>
            <ElButton v-if="hasAuth(PERMISSION_CODES.ADMIN_MANAGE)" type="primary" @click="handleAdd">
              新增菜单
            </ElButton>
          </div>
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <ElFormItem label="父菜单">
          <ElSelect v-model="form.parent_id" placeholder="选择父菜单" clearable>
            <ElOption
              v-for="m in flattenMenusWithIndent(menus, 0, editingId)"
              :key="m.id"
              :label="`${'\u0020\u0020'.repeat(m.indent)}${m.name}`"
              :value="m.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" placeholder="菜单名称" />
        </ElFormItem>
        <ElFormItem label="路由标识">
          <ElInput v-model="form.route_key" placeholder="如 subjects_list" />
        </ElFormItem>
        <ElFormItem label="路径" prop="path">
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
        <ElFormItem label="i18n键">
          <ElInput v-model="form.i18n_key" placeholder="如 menu.subjects" />
        </ElFormItem>
        <ElFormItem label="隐藏菜单">
          <ElSwitch v-model="form.hide_in_menu" />
        </ElFormItem>
        <ElFormItem label="可见">
          <ElSwitch v-model="form.is_visible" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="form.is_active" />
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
