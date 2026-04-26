<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

defineOptions({ name: 'ConfigOperation' });

const themeStore = useThemeStore();

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(getClipboardText());
    window.$message?.success($t('theme.configOperation.copySuccessMsg'));
  } catch {
    window.$message?.error('复制失败');
  }
}

function getClipboardText() {
  const reg = /"\w+":/g;

  const json = themeStore.settingsJson;

  return json.replace(reg, match => match.replace(/"/g, ''));
}

function handleReset() {
  themeStore.resetStore();

  setTimeout(() => {
    window.$message?.success($t('theme.configOperation.resetSuccessMsg'));
  }, 50);
}
</script>

<template>
  <div class="w-full flex justify-between">
    <ElButton type="danger" plain @click="handleReset">{{ $t('theme.configOperation.resetConfig') }}</ElButton>
    <ElButton type="primary" @click="handleCopy">{{ $t('theme.configOperation.copyConfig') }}</ElButton>
  </div>
</template>

<style scoped></style>
