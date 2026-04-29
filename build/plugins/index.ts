import process from 'node:process';
import type { PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import progress from 'vite-plugin-progress';
import { setupElegantRouter } from './router';
import { setupUnocss } from './unocss';
import { setupUnplugin } from './unplugin';
import { setupHtmlPlugin } from './html';

export async function setupVitePlugins(viteEnv: Env.ImportMeta, buildTime: string) {
  const plugins: PluginOption = [
    vue(),
    vueJsx(),
    setupElegantRouter(),
    setupUnocss(viteEnv),
    ...setupUnplugin(viteEnv),
    progress(),
    setupHtmlPlugin(buildTime)
  ];

  if (process.env.VITE_DEVTOOLS !== 'false' && process.env.NODE_ENV !== 'production') {
    const VueDevtools = (await import('vite-plugin-vue-devtools')).default;
    const { VITE_DEVTOOLS_LAUNCH_EDITOR } = viteEnv;
    plugins.push(VueDevtools({ launchEditor: VITE_DEVTOOLS_LAUNCH_EDITOR }));
  }

  return plugins;
}
