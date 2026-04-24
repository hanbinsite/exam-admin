import { request } from '../request';

export function fetchAdminMenus() {
  return request<Exam.Auth.AuthMenusResponse>({
    url: '/admin/auth/menus'
  });
}
