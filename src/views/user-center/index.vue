<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchAdminMe, fetchChangePassword, fetchUpdateAdminMe } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';

defineOptions({ name: 'UserCenter' });

const authStore = useAuthStore();
const activeTab = ref('profile');
const profileLoading = ref(false);
const passwordLoading = ref(false);

const profileForm = reactive({
  name: '',
  email: ''
});

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
});

async function loadProfile() {
  profileLoading.value = true;
  const { data, error } = await fetchAdminMe();
  if (!error && data) {
    profileForm.name = data.name;
    profileForm.email = data.email;
  }
  profileLoading.value = false;
}

async function handleUpdateProfile() {
  if (!profileForm.name.trim()) {
    ElMessage.warning('姓名不能为空');
    return;
  }
  if (!profileForm.email.trim()) {
    ElMessage.warning('邮箱不能为空');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
    ElMessage.warning('邮箱格式不正确');
    return;
  }
  profileLoading.value = true;
  const { data, error } = await fetchUpdateAdminMe({
    name: profileForm.name,
    email: profileForm.email
  });
  if (!error && data) {
    ElMessage.success('个人信息更新成功');
    authStore.userInfo.name = data.name;
    authStore.userInfo.email = data.email;
    localStg.set('adminInfo', {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role
    });
  }
  profileLoading.value = false;
}

async function handleChangePassword() {
  if (!passwordForm.old_password) {
    ElMessage.warning('请输入当前密码');
    return;
  }
  if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
    ElMessage.warning('新密码长度至少6位');
    return;
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }
  passwordLoading.value = true;
  const { error } = await fetchChangePassword(passwordForm.old_password, passwordForm.new_password);
  if (!error) {
    ElMessage.success('密码修改成功');
    passwordForm.old_password = '';
    passwordForm.new_password = '';
    passwordForm.confirm_password = '';
  }
  passwordLoading.value = false;
}

onMounted(loadProfile);
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden">
    <ElCard class="card-wrapper">
      <ElTabs v-model="activeTab">
        <ElTabPane label="个人信息" name="profile">
          <ElForm v-loading="profileLoading" :model="profileForm" label-width="100px" style="max-width: 500px">
            <ElFormItem label="姓名">
              <ElInput v-model="profileForm.name" placeholder="请输入姓名" />
            </ElFormItem>
            <ElFormItem label="邮箱">
              <ElInput v-model="profileForm.email" placeholder="请输入邮箱" />
            </ElFormItem>
            <ElFormItem label="角色">
              <ElInput
                :model-value="
                  authStore.userInfo.role === 'super_admin'
                    ? '超级管理员'
                    : authStore.userInfo.role === 'admin'
                      ? '管理员'
                      : authStore.userInfo.role === 'teacher'
                        ? '教师'
                        : authStore.userInfo.role
                "
                disabled
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="handleUpdateProfile">保存修改</ElButton>
            </ElFormItem>
          </ElForm>
        </ElTabPane>

        <ElTabPane label="修改密码" name="password">
          <ElForm v-loading="passwordLoading" :model="passwordForm" label-width="100px" style="max-width: 500px">
            <ElFormItem label="当前密码">
              <ElInput v-model="passwordForm.old_password" type="password" show-password placeholder="请输入当前密码" />
            </ElFormItem>
            <ElFormItem label="新密码">
              <ElInput v-model="passwordForm.new_password" type="password" show-password placeholder="至少6位字符" />
            </ElFormItem>
            <ElFormItem label="确认密码">
              <ElInput
                v-model="passwordForm.confirm_password"
                type="password"
                show-password
                placeholder="再次输入新密码"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="handleChangePassword">修改密码</ElButton>
            </ElFormItem>
          </ElForm>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<style scoped></style>
