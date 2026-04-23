import { request } from '../request';

export function fetchUserList(page: number = 1, pageSize: number = 20) {
  return request<Exam.User.UserListData>({
    url: '/admin/users',
    params: { page, pageSize }
  });
}

export function fetchResetUserPassword(userId: string, newPassword: string) {
  return request<{ message: string }>({
    url: `/admin/users/${userId}/reset-password`,
    method: 'put',
    data: { user_id: userId, new_password: newPassword }
  });
}
