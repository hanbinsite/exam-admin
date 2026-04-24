import { request } from '../request';

export function fetchExamSessionList(examId: number, page: number = 1, pageSize: number = 20) {
  return request<Exam.ExamSession.ExamSessionListData>({
    url: `/admin/exams/${examId}/sessions`,
    params: { page, pageSize }
  });
}

export function fetchExamSessionById(sessionId: number) {
  return request<Exam.ExamSession.ExamSessionDetail>({
    url: `/admin/exams/sessions/${sessionId}`
  });
}
