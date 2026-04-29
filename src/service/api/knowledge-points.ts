import { request } from '../request';

export function fetchKnowledgePointTree(subjectId: string) {
  return request<Exam.KnowledgePoint.KnowledgePoint[]>({
    url: `/admin/knowledge-points/subjects/${subjectId}`
  });
}

export function fetchKnowledgePointDetail(kpId: number) {
  return request<Exam.KnowledgePoint.KnowledgePoint>({
    url: `/admin/knowledge-points/${kpId}`
  });
}

export function fetchCreateKnowledgePoint(data: Exam.KnowledgePoint.KnowledgePointCreateRequest) {
  return request<Exam.KnowledgePoint.KnowledgePoint>({
    url: '/admin/knowledge-points',
    method: 'post',
    data
  });
}

export function fetchUpdateKnowledgePoint(
  kpId: number,
  data: Partial<Exam.KnowledgePoint.KnowledgePointCreateRequest>
) {
  return request<Exam.KnowledgePoint.KnowledgePoint>({
    url: `/admin/knowledge-points/${kpId}`,
    method: 'put',
    data
  });
}

export function fetchDeleteKnowledgePoint(kpId: number) {
  return request<null>({
    url: `/admin/knowledge-points/${kpId}`,
    method: 'delete'
  });
}

export function fetchAssignKnowledgePoints(questionId: number, knowledgePointIds: number[], primaryId?: number) {
  return request<null>({
    url: '/admin/knowledge-points/assign',
    method: 'post',
    data: { question_id: questionId, knowledge_point_ids: knowledgePointIds, primary_id: primaryId }
  });
}

export function fetchQuestionKnowledgePoints(questionId: number) {
  return request<Exam.KnowledgePoint.KnowledgePoint[]>({
    url: `/admin/knowledge-points/questions/${questionId}`
  });
}
