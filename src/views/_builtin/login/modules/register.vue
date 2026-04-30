<script setup lang="ts">
import { onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({ name: 'Register' });

const { toggleLoginModule } = useRouterPush();

onMounted(() => {
  ElMessageBox.alert('暂不支持注册，请联系管理员', '提示', {
    confirmButtonText: '确定',
    callback: () => {
      toggleLoginModule('pwd-login');
    }
  });
});
</script>

<template>
  <div class="flex-center py-24px text-gray-400">暂不支持注册，请联系管理员</div>
</template>

<style scoped></style>
