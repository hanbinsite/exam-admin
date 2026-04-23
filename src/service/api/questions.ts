import { request } from '../request';

export function fetchQuestionList(subjectId: string, params: Exam.Question.QuestionListParams = {}) {
  return request<Exam.Question.QuestionListData>({
    url: `/admin/subjects/${subjectId}/questions`,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      type_id: params.type_id,
      difficulty: params.difficulty,
      category: params.category,
      keyword: params.keyword
    }
  });
}

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
