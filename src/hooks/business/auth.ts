import { useAuthStore } from '@/store/modules/auth';

export function useAuth() {
  const authStore = useAuthStore();

  function hasAuth(codes: string | string[]) {
    if (!authStore.isLogin) {
      return false;
    }

    if (authStore.isSuper) {
      return true;
    }

    const codeList = typeof codes === 'string' ? [codes] : codes;

    return codeList.some(code => authStore.permissionCodes.includes(code));
  }

  return {
    hasAuth
  };
}
