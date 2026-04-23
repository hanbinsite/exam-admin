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

export function fetchCustomBackendError(code: string, msg: string) {
  return request<null>({
    url: '/admin/auth/error',
    params: { code, msg }
  });
}
