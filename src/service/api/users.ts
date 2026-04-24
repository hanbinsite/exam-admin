import { request } from '../request';

export function fetchUserList(page: number = 1, pageSize: number = 20, keyword?: string) {
  return request<Exam.User.UserListData>({
    url: '/admin/users',
    params: { page, pageSize, ...(keyword ? { keyword } : {}) }
  });
}

export function fetchUserById(userId: string) {
  return request<Exam.User.User>({
    url: `/admin/users/${userId}`
  });
}

export function fetchActivateUser(userId: string) {
  return request<{ message: string }>({
    url: `/admin/users/${userId}/activate`,
    method: 'put'
  });
}

export function fetchDeleteUser(userId: string) {
  return request<null>({
    url: `/admin/users/${userId}`,
    method: 'delete'
  });
}

export function fetchResetUserPassword(userId: string, newPassword: string) {
  return request<{ message: string }>({
    url: `/admin/users/${userId}/reset-password`,
    method: 'put',
    data: { new_password: newPassword }
  });
}
