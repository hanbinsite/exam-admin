import { useAuthStore } from '@/store/modules/auth';

export function useAuth() {
  const authStore = useAuthStore();

  function hasAuth(codes: string | string[]) {
    if (!authStore.isLogin) {
      return false;
    }

    const buttons: string[] = [];

    if (typeof codes === 'string') {
      return buttons.includes(codes);
    }

    return codes.some(code => buttons.includes(code));
  }

  return {
    hasAuth
  };
}
