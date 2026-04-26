<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  fetchAdminList,
  fetchAdminRegister,
  fetchAdminSubjects,
  fetchAssignSubjectAdmin,
  fetchRemoveSubjectAdmin,
  fetchRoleList,
  fetchSubjectList,
  fetchUpdateAdminRole
} from '@/service/api';

defineOptions({ name: 'RbacAdmins' });

const admins = ref<Exam.RBAC.AdminDetail[]>([]);
const roles = ref<Exam.RBAC.Role[]>([]);
const subjects = ref<Exam.Subject.Subject[]>([]);
const loading = ref(false);
const registerVisible = ref(false);
const registerSubmitting = ref(false);
const registerFormRef = ref<FormInstance>();

const registerForm = reactive({
  name: '',
  email: '',
  password: ''
});

const registerRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
};

const subjectDialogVisible = ref(false);
const subjectSubmitting = ref(false);
const currentAdminId = ref('');
const currentAdminSubjects = ref<string[]>([]);

async function loadData() {
  loading.value = true;
  const [adminsRes, rolesRes, subjectsRes] = await Promise.all([fetchAdminList(), fetchRoleList(), fetchSubjectList()]);
  if (!adminsRes.error && adminsRes.data) admins.value = adminsRes.data;
  if (!rolesRes.error && rolesRes.data) roles.value = rolesRes.data;
  if (!subjectsRes.error && subjectsRes.data) subjects.value = subjectsRes.data;
  loading.value = false;
}

async function handleRoleChange(adminId: string, roleCode: string) {
  const role = roles.value.find(r => r.code === roleCode);
  try {
    await ElMessageBox.confirm(`确定将该管理员角色改为"${role?.name || roleCode}"吗？`, '角色变更确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
  } catch {
    loadData();
    return;
  }
  const { error } = await fetchUpdateAdminRole(adminId, roleCode);
  if (!error) {
    ElMessage.success('角色更新成功');
    loadData();
  }
}

async function handleSubjectManage(admin: Exam.RBAC.AdminDetail) {
  currentAdminId.value = admin.id;
  const { data, error } = await fetchAdminSubjects(admin.id);
  if (!error && data) {
    currentAdminSubjects.value = data;
  } else {
    currentAdminSubjects.value = [];
  }
  subjectDialogVisible.value = true;
}

async function handleSubjectChange() {
  subjectSubmitting.value = true;
  try {
    const existing = (await fetchAdminSubjects(currentAdminId.value)).data || [];
    const toAdd = currentAdminSubjects.value.filter(s => !existing.includes(s));
    const toRemove = existing.filter((s: string) => !currentAdminSubjects.value.includes(s));

    await Promise.all([
      ...toAdd.map(subjectId => fetchAssignSubjectAdmin(currentAdminId.value, subjectId)),
      ...toRemove.map(subjectId => fetchRemoveSubjectAdmin(currentAdminId.value, subjectId))
    ]);
    ElMessage.success('科目授权更新成功');
    subjectDialogVisible.value = false;
    loadData();
  } catch {
    ElMessage.error('科目授权更新失败');
  } finally {
    subjectSubmitting.value = false;
  }
}

function handleRegister() {
  registerForm.name = '';
  registerForm.email = '';
  registerForm.password = '';
  registerVisible.value = true;
}

async function handleRegisterSubmit() {
  const valid = await registerFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  registerSubmitting.value = true;
  try {
    const { error } = await fetchAdminRegister(registerForm.name, registerForm.email, registerForm.password);
    if (!error) {
      ElMessage.success('注册成功');
      registerVisible.value = false;
      loadData();
    }
  } finally {
    registerSubmitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p>管理员管理</p>
          <ElButton type="primary" @click="handleRegister">新增管理员</ElButton>
        </div>
      </template>
      <ElTable v-loading="loading" :data="admins" border stripe>
        <ElTableColumn prop="id" label="ID" width="280" />
        <ElTableColumn prop="name" label="姓名" min-width="120" />
        <ElTableColumn prop="email" label="邮箱" min-width="200" />
        <ElTableColumn label="角色" width="160">
          <template #default="{ row }">
            <ElSelect
              :model-value="row.role?.code"
              size="small"
              @change="(val: string) => handleRoleChange(row.id, val)"
            >
              <ElOption v-for="r in roles" :key="r.code" :label="r.name" :value="r.code" />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="授权科目" width="120" align="center">
          <template #default="{ row }">
            <ElTag>{{ row.subjects?.length || 0 }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="120" align="center">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="handleSubjectManage(row)">科目授权</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="registerVisible" title="新增管理员" width="450px">
      <ElForm ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="80px">
        <ElFormItem label="姓名" prop="name">
          <ElInput v-model="registerForm.name" />
        </ElFormItem>
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="registerForm.email" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput v-model="registerForm.password" type="password" show-password />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="registerVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="registerSubmitting" @click="handleRegisterSubmit">注册</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="subjectDialogVisible" title="科目授权" width="450px">
      <ElCheckboxGroup v-model="currentAdminSubjects">
        <ElCheckbox v-for="s in subjects" :key="s.id" :value="s.id" class="mb-8px w-full">
          {{ s.name }}
        </ElCheckbox>
      </ElCheckboxGroup>
      <template #footer>
        <ElButton @click="subjectDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="subjectSubmitting" @click="handleSubjectChange">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped></style>
