import { request } from '../request';

export function fetchMaterialList(
  subjectId: string,
  params: { page?: number; pageSize?: number; type?: Exam.Material.MaterialType } = {}
) {
  return request<Exam.Material.MaterialListData>({
    url: `/subjects/${subjectId}/materials`,
    params: { page: params.page || 1, pageSize: params.pageSize || 20, ...(params.type ? { type: params.type } : {}) }
  });
}

export function fetchMaterialDetail(materialId: number) {
  return request<Exam.Material.Material>({
    url: `/materials/${materialId}`
  });
}

export function fetchCreateMaterial(data: Exam.Material.MaterialCreateRequest) {
  return request<Exam.Material.Material>({
    url: '/admin/materials',
    method: 'post',
    data
  });
}

export function fetchUpdateMaterial(materialId: number, data: Partial<Exam.Material.MaterialCreateRequest>) {
  return request<Exam.Material.Material>({
    url: `/admin/materials/${materialId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteMaterial(materialId: number) {
  return request<null>({
    url: `/admin/materials/${materialId}`,
    method: 'delete'
  });
}
