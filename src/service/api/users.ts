import { request } from '../request';

export function fetchCreateUser(data: { name: string; email: string; password: string; phone?: string }) {
  return request<Exam.User.User>({
    url: '/admin/users',
    method: 'post',
    data
  });
}

export function fetchUserList(page: number = 1, pageSize: number = 20, keyword?: string) {
  return request<Exam.User.UserListData>({
    url: '/admin/users',
    params: { page, pageSize, ...(keyword ? { keyword } : {}) }
  });
}

export function fetchUserDetail(userId: string) {
  return request<Exam.User.UserDetail>({
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

export function fetchAssignUserCode(userId: string, userCode?: string) {
  return request<{ user_id: string; user_code: string }>({
    url: `/admin/users/${userId}/assign-code`,
    method: 'put',
    data: userCode ? { user_code: userCode } : {}
  });
}
