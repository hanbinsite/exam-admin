import { request } from '../request';

export function fetchQuestionStats(subjectId: string) {
  return request<Exam.Question.QuestionStats>({
    url: `/subjects/${subjectId}/questions/stats`
  });
}

export function fetchCreateQuestion(data: Exam.Question.QuestionCreateRequest) {
  return request<Exam.Question.Question>({
    url: '/admin/questions',
    method: 'post',
    data
  });
}

export function fetchUpdateQuestion(questionId: number, data: Partial<Exam.Question.QuestionCreateRequest>) {
  return request<Exam.Question.Question>({
    url: `/admin/questions/${questionId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteQuestion(questionId: number) {
  return request<null>({
    url: `/admin/questions/${questionId}`,
    method: 'delete'
  });
}

export function fetchBatchImportQuestions(questions: Exam.Question.QuestionCreateRequest[]) {
  return request<Exam.Question.BatchImportResult>({
    url: '/admin/questions/batch',
    method: 'post',
    data: questions
  });
}
