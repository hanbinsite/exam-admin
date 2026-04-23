<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useForm, useFormRules } from '@/hooks/common/form';

defineOptions({ name: 'PwdLogin' });

const authStore = useAuthStore();
const { formRef, validate } = useForm();

interface FormModel {
  userName: string;
  password: string;
}

const model = ref<FormModel>({
  userName: '',
  password: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd
  };
});

async function handleSubmit() {
  await validate();
  await authStore.login(model.value.userName, model.value.password);
}
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <ElFormItem prop="userName">
      <ElInput v-model="model.userName" placeholder="请输入账号" />
    </ElFormItem>
    <ElFormItem prop="password">
      <ElInput v-model="model.password" type="password" show-password-on="click" placeholder="请输入密码" />
    </ElFormItem>
    <ElButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
      登录
    </ElButton>
  </ElForm>
</template>

<style scoped></style>
