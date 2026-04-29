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
  name: '',
  path: '',
  parent_name: '',
  meta: {
    title: '',
    i18nKey: '',
    icon: '',
    order: 0,
    hideInMenu: false,
    href: ''
  }
});

const editingId = ref<number | null>(null);

const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单标识', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  'meta.title': [{ required: true, message: '请输入标题', trigger: 'blur' }]
};

function resetForm() {
  form.name = '';
  form.path = '';
  form.parent_name = '';
  form.meta = { title: '', i18nKey: '', icon: '', order: 0, hideInMenu: false, href: '' };
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
  form.name = row.name;
  form.path = row.path;
  form.parent_name = '';
  form.meta.title = row.meta.title;
  form.meta.i18nKey = row.meta.i18nKey || '';
  form.meta.icon = row.meta.icon || '';
  form.meta.order = row.meta.order;
  form.meta.hideInMenu = row.meta.hideInMenu;
  form.meta.href = row.meta.href || '';
  dialogTitle.value = '编辑菜单';
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const data: Exam.RBAC.MenuCreateRequest = {
      name: form.name,
      path: form.path,
      parent_name: form.parent_name || undefined,
      meta: {
        title: form.meta.title,
        i18nKey: form.meta.i18nKey,
        icon: form.meta.icon,
        order: form.meta.order,
        hideInMenu: form.meta.hideInMenu,
        href: form.meta.href || null
      }
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
  await ElMessageBox.confirm(`确定删除菜单「${row.meta.title || row.name}」吗？`, '删除确认', {
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

interface FlatMenu {
  name: string;
  title: string;
  indent: number;
}

function flattenMenusWithIndent(menuList: Exam.RBAC.Menu[], indent = 0, excludeName?: string | null): FlatMenu[] {
  const result: FlatMenu[] = [];
  for (const menu of menuList) {
    if (menu.name !== excludeName) {
      result.push({ name: menu.name, title: menu.meta.title, indent });
    }
    if (menu.children && menu.children.length > 0 && menu.name !== excludeName) {
      result.push(...flattenMenusWithIndent(menu.children, indent + 1, excludeName));
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
        <ElTableColumn label="标识" min-width="160" align="left">
          <template #default="{ row }">
            <span class="font-medium">{{ row.name }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标题" min-width="120">
          <template #default="{ row }">
            <ElTag size="small" type="warning">{{ row.meta.title }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="path" label="路径" min-width="180" />
        <ElTableColumn label="图标" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.meta.icon">{{ row.meta.icon }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="i18nKey" min-width="180">
          <template #default="{ row }">
            <span class="text-xs text-gray-500">{{ row.meta.i18nKey || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="排序" width="70" align="center">
          <template #default="{ row }">
            {{ row.meta.order }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="隐藏" width="70" align="center">
          <template #default="{ row }">
            <ElTag :type="row.meta.hideInMenu ? 'danger' : 'success'" size="small">
              {{ row.meta.hideInMenu ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="160" align="center">
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="550px" @close="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="父菜单">
          <ElSelect v-model="form.parent_name" placeholder="留空为顶级菜单" clearable>
            <ElOption
              v-for="m in flattenMenusWithIndent(menus, 0, editingId ? form.name : null)"
              :key="m.name"
              :label="`${'  '.repeat(m.indent)}${m.title}`"
              :value="m.name"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="菜单标识" prop="name">
          <ElInput v-model="form.name" :disabled="!!editingId" placeholder="唯一标识，如 subjects" />
        </ElFormItem>
        <ElFormItem label="标题" prop="meta.title">
          <ElInput v-model="form.meta.title" placeholder="显示标题，如 科目管理" />
        </ElFormItem>
        <ElFormItem label="路径" prop="path">
          <ElInput v-model="form.path" placeholder="/subjects" />
        </ElFormItem>
        <ElFormItem label="i18nKey">
          <ElInput v-model="form.meta.i18nKey" placeholder="如 route.subjects" />
        </ElFormItem>
        <ElFormItem label="图标">
          <ElInput v-model="form.meta.icon" placeholder="如 mdi:book-open-variant" />
        </ElFormItem>
        <ElFormItem label="外链">
          <ElInput v-model="form.meta.href" placeholder="外部链接地址" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.meta.order" :min="0" />
        </ElFormItem>
        <ElFormItem label="隐藏菜单">
          <ElSwitch v-model="form.meta.hideInMenu" />
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
