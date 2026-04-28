import { request } from '../request';

export function fetchAdminLogin(email: string, password: string) {
  return request<Exam.Auth.LoginToken>({
    url: '/admin/auth/login',
    method: 'post',
    data: { email, password }
  });
}

export function fetchAdminRegister(name: string, email: string, password: string) {
  return request<Exam.Auth.LoginToken>({
    url: '/admin/auth/register',
    method: 'post',
    data: { name, email, password }
  });
}

export function fetchAdminMe() {
  return request<Exam.Auth.AdminProfile>({
    url: '/admin/auth/me'
  });
}

export function fetchAdminPermissions() {
  return request<string[]>({
    url: '/admin/auth/permissions'
  });
}

export function fetchUpdateAdminMe(data: { name?: string; email?: string }) {
  return request<Exam.Auth.AdminProfile>({
    url: '/admin/auth/me',
    method: 'put',
    data
  });
}

export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return request<{ message: string }>({
    url: '/admin/auth/password',
    method: 'put',
    data: { old_password: oldPassword, new_password: newPassword }
  });
}
