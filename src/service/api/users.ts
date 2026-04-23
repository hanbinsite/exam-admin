import { request } from '../request';

export function fetchUserList(page: number = 1, pageSize: number = 20) {
  return request<Exam.User.UserListData>({
    url: '/admin/users',
    params: { page, pageSize }
  });
}
