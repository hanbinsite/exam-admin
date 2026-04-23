import { request } from '../request';

export function fetchDashboardOverview() {
  return request<Exam.Dashboard.DashboardData>({
    url: '/admin/dashboard'
  });
}
