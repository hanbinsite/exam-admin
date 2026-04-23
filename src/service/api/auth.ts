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

export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return request<{ message: string }>({
    url: '/admin/auth/password',
    method: 'put',
    data: { old_password: oldPassword, new_password: newPassword }
  });
}

export function fetchCustomBackendError(code: string, msg: string) {
  return request<null>({
    url: '/admin/auth/error',
    params: { code, msg }
  });
}
