import { request } from '../request';

export function fetchRbacInit() {
  return request<Exam.RBAC.RbacInitResult>({
    url: '/admin/rbac/init',
    method: 'post'
  });
}

export function fetchPermissionList() {
  return request<Exam.RBAC.Permission[]>({
    url: '/admin/rbac/permissions'
  });
}

export function fetchCreatePermission(data: { code: string; name: string; description?: string }) {
  return request<Exam.RBAC.Permission>({
    url: '/admin/rbac/permissions',
    method: 'post',
    data
  });
}

export function fetchUpdatePermission(id: number, data: Partial<Exam.RBAC.Permission>) {
  return request<Exam.RBAC.Permission>({
    url: `/admin/rbac/permissions/${id}`,
    method: 'put',
    data
  });
}

export function fetchDeletePermission(id: number) {
  return request<null>({
    url: `/admin/rbac/permissions/${id}`,
    method: 'delete'
  });
}

export function fetchRoleList(includeInactive?: boolean) {
  return request<Exam.RBAC.Role[]>({
    url: '/admin/rbac/roles',
    params: includeInactive ? { includeInactive: true } : undefined
  });
}

export function fetchRoleById(roleId: number) {
  return request<Exam.RBAC.Role>({
    url: `/admin/rbac/roles/${roleId}`
  });
}

export function fetchCreateRole(data: {
  name: string;
  code: string;
  description?: string;
  is_super?: boolean;
  sort_order?: number;
}) {
  return request<Exam.RBAC.Role>({
    url: '/admin/rbac/roles',
    method: 'post',
    data
  });
}

export function fetchUpdateRole(roleId: number, data: Partial<Exam.RBAC.Role>) {
  return request<Exam.RBAC.Role>({
    url: `/admin/rbac/roles/${roleId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteRole(roleId: number) {
  return request<null>({
    url: `/admin/rbac/roles/${roleId}`,
    method: 'delete'
  });
}

export function fetchRolePermissions(roleCode: string) {
  return request<Exam.RBAC.Permission[]>({
    url: `/admin/rbac/roles/${roleCode}/permissions`
  });
}

export function fetchAssignRolePermissions(roleCode: string, permissionCodes: string[]) {
  return request<null>({
    url: '/admin/rbac/roles/permissions',
    method: 'post',
    data: { role_code: roleCode, permission_codes: permissionCodes }
  });
}

export function fetchMenuList() {
  return request<Exam.RBAC.Menu[]>({
    url: '/admin/rbac/menus'
  });
}

export function fetchCreateMenu(data: Exam.RBAC.MenuCreateRequest) {
  return request<Exam.RBAC.Menu>({
    url: '/admin/rbac/menus',
    method: 'post',
    data
  });
}

export function fetchUpdateMenu(menuId: number, data: Partial<Exam.RBAC.MenuCreateRequest>) {
  return request<Exam.RBAC.Menu>({
    url: `/admin/rbac/menus/${menuId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteMenu(menuId: number) {
  return request<null>({
    url: `/admin/rbac/menus/${menuId}`,
    method: 'delete'
  });
}

export function fetchRoleMenus(roleCode: string) {
  return request<Exam.RBAC.Menu[]>({
    url: `/admin/rbac/roles/${roleCode}/menus`
  });
}

export function fetchAssignRoleMenus(roleCode: string, menuIds: number[]) {
  return request<null>({
    url: '/admin/rbac/roles/menus',
    method: 'post',
    data: { role_code: roleCode, menu_ids: menuIds }
  });
}

export function fetchAdminList() {
  return request<Exam.RBAC.AdminDetail[]>({
    url: '/admin/rbac/admins'
  });
}

export function fetchUpdateAdminRole(adminId: string, roleCode: string) {
  return request<null>({
    url: `/admin/rbac/admins/${adminId}/role`,
    method: 'put',
    data: { role_code: roleCode }
  });
}

export function fetchRbacAdminMenus(adminId: string) {
  return request<Exam.RBAC.Menu[]>({
    url: `/admin/rbac/admins/${adminId}/menus`
  });
}

export function fetchAdminSubjects(adminId: string) {
  return request<string[]>({
    url: `/admin/rbac/admins/${adminId}/subjects`
  });
}

export function fetchAssignSubjectAdmin(adminId: string, subjectId: string) {
  return request<{ id: number; admin_id: string; subject_id: string }>({
    url: '/admin/rbac/subject-admins',
    method: 'post',
    data: { admin_id: adminId, subject_id: subjectId }
  });
}

export function fetchRemoveSubjectAdmin(adminId: string, subjectId: string) {
  return request<null>({
    url: '/admin/rbac/subject-admins',
    method: 'delete',
    params: { adminId, subjectId }
  });
}

export function fetchAdminDetail(adminId: string) {
  return request<Exam.RBAC.AdminDetail>({
    url: `/admin/rbac/admins/${adminId}`
  });
}

export function fetchDeactivateAdmin(adminId: string) {
  return request<{ id: string; is_active: boolean }>({
    url: `/admin/rbac/admins/${adminId}/deactivate`,
    method: 'put'
  });
}

export function fetchActivateAdmin(adminId: string) {
  return request<{ id: string; is_active: boolean }>({
    url: `/admin/rbac/admins/${adminId}/activate`,
    method: 'put'
  });
}

export function fetchUserSubjects(userId: string) {
  return request<{ user_id: string; subject_ids: string[] }>({
    url: `/admin/rbac/user-subjects/${userId}`
  });
}

export function fetchSubjectUsers(subjectId: string) {
  return request<{ subject_id: string; user_ids: string[] }>({
    url: `/admin/rbac/user-subjects/subject/${subjectId}`
  });
}

export function fetchAssignUserSubject(userId: string, subjectId: string) {
  return request<null>({
    url: '/admin/rbac/user-subjects',
    method: 'post',
    data: { user_id: userId, subject_id: subjectId, granted_at: new Date().toISOString() }
  });
}

export function fetchRemoveUserSubject(userId: string, subjectId: string) {
  return request<null>({
    url: '/admin/rbac/user-subjects',
    method: 'delete',
    params: { userId, subjectId }
  });
}
