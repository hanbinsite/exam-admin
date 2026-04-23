import { request } from '../request';

export function fetchScoreStats(subjectId: string) {
  return request<Exam.Score.ScoreStats>({
    url: '/admin/scores/stats',
    params: { subjectId }
  });
}

export function fetchScoreList(subjectId: string, page: number = 1, pageSize: number = 20) {
  return request<Exam.Score.ScoreListData>({
    url: '/admin/scores/list',
    params: { subjectId, page, pageSize }
  });
}
