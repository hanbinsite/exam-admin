import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchAdminLogin, fetchAdminLogout, fetchAdminMe, fetchAdminPermissions } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const authStore = useAuthStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Exam.Auth.AdminInfo = reactive({
    id: '',
    name: '',
    email: '',
    role: 'admin'
  });

  const isSuperAdmin = ref(false);

  const permissionCodes = ref<string[]>([]);

  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.role === VITE_STATIC_SUPER_ROLE;
  });

  const isDynamicSuper = computed(() => {
    return import.meta.env.VITE_AUTH_ROUTE_MODE === 'dynamic' && isSuperAdmin.value;
  });

  const isSuper = computed(() => isStaticSuper.value || isDynamicSuper.value);

  const isLogin = computed(() => Boolean(token.value));

  async function resetStore() {
    recordUserId();

    clearAuthStorage();
    localStg.remove('currentSubjectId');

    authStore.$reset();

    fetchAdminLogout().catch(() => {});

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  function recordUserId() {
    if (!userInfo.id) {
      return;
    }

    localStg.set('lastLoginUserId', userInfo.id);
  }

  function checkTabClear(): boolean {
    if (!userInfo.id) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    if (lastLoginUserId !== userInfo.id) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      return true;
    }

    return false;
  }

  async function loadPermissionCodes() {
    const { data } = await fetchAdminPermissions();
    if (data) {
      permissionCodes.value = data;
      localStg.set('permissionCodes', data);
    }
  }

  async function login(email: string, password: string, redirect = true) {
    startLoading();

    const { data: loginData, error } = await fetchAdminLogin(email, password);

    if (!error) {
      const pass = await loginByToken(loginData);

      if (pass) {
        await loadPermissionCodes();

        const isClear = checkTabClear();
        let needRedirect = redirect;

        if (isClear) {
          needRedirect = false;
        }
        await redirectFromLogin(needRedirect);

        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          message: $t('page.login.common.welcomeBack', { userName: userInfo.name }),
          duration: 4500
        });
      }
    } else {
      resetStore();
    }

    endLoading();
  }

  async function loginByToken(loginData: Exam.Auth.LoginToken) {
    localStg.set('token', loginData.token);
    localStg.set('adminInfo', loginData.admin);

    Object.assign(userInfo, loginData.admin);
    token.value = loginData.token;

    const { data: profile } = await fetchAdminMe();
    if (profile?.role_info) {
      isSuperAdmin.value = profile.role_info.is_super;
    }

    return true;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      if (userInfo.id) return;

      const adminInfo = localStg.get('adminInfo') as Exam.Auth.AdminInfo | null;
      if (adminInfo) {
        Object.assign(userInfo, adminInfo);
        const cached = localStg.get('permissionCodes') as string[] | null;
        if (cached) {
          permissionCodes.value = cached;
        }
        fetchAdminMe().then(({ data }) => {
          if (data?.role_info) {
            isSuperAdmin.value = data.role_info.is_super;
          }
        });
        loadPermissionCodes();
      } else {
        resetStore();
      }
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isDynamicSuper,
    isSuper,
    isSuperAdmin,
    isLogin,
    loginLoading,
    permissionCodes,
    resetStore,
    login,
    initUserInfo
  };
});
