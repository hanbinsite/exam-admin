import { request } from '../request';

export function fetchExamList(subjectId: string) {
  return request<Exam.ExamModule.ExamConfig[]>({
    url: `/subjects/${subjectId}/exams`
  });
}

export function fetchExamById(examId: number) {
  return request<Exam.ExamModule.ExamConfig>({
    url: `/exams/${examId}`
  });
}

export function fetchCreateExam(data: Exam.ExamModule.ExamCreateRequest) {
  return request<Exam.ExamModule.ExamConfig>({
    url: '/admin/exams',
    method: 'post',
    data
  });
}

export function fetchUpdateExam(examId: number, data: Partial<Exam.ExamModule.ExamCreateRequest>) {
  return request<Exam.ExamModule.ExamConfig>({
    url: `/admin/exams/${examId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteExam(examId: number) {
  return request<{ id: number }>({
    url: `/admin/exams/${examId}`,
    method: 'delete'
  });
}
