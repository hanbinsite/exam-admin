import { request } from '../request';

export function fetchSubjectList(page?: number, pageSize?: number) {
  return request<Exam.Subject.SubjectListData>({
    url: '/subjects',
    params: page !== undefined && pageSize !== undefined ? { page, pageSize } : undefined
  });
}

export function fetchSubjectById(subjectId: string) {
  return request<Exam.Subject.Subject>({
    url: `/subjects/${subjectId}`
  });
}

export function fetchCreateSubject(data: Exam.Subject.SubjectCreateRequest) {
  return request<Exam.Subject.Subject>({
    url: '/admin/subjects',
    method: 'post',
    data
  });
}

export function fetchUpdateSubject(subjectId: string, data: Exam.Subject.SubjectUpdateRequest) {
  return request<Exam.Subject.Subject>({
    url: `/admin/subjects/${subjectId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteSubject(subjectId: string) {
  return request<null>({
    url: `/admin/subjects/${subjectId}`,
    method: 'delete'
  });
}
