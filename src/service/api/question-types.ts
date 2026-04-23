import { request } from '../request';

export function fetchQuestionTypeList(subjectId: string) {
  return request<Exam.QuestionType.QuestionType[]>({
    url: `/subjects/${subjectId}/question-types`
  });
}

export function fetchCreateQuestionType(data: Exam.QuestionType.QuestionTypeCreateRequest) {
  return request<Exam.QuestionType.QuestionType>({
    url: '/admin/question-types',
    method: 'post',
    data
  });
}

export function fetchUpdateQuestionType(typeId: number, data: Partial<Exam.QuestionType.QuestionTypeCreateRequest>) {
  return request<Exam.QuestionType.QuestionType>({
    url: `/admin/question-types/${typeId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteQuestionType(typeId: number) {
  return request<null>({
    url: `/admin/question-types/${typeId}`,
    method: 'delete'
  });
}
