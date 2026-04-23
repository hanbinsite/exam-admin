export const PERMISSION_CODES = {
  SUBJECT_MANAGE: 'subject:manage',
  QUESTION_MANAGE: 'question:manage',
  QUESTION_TYPE_MANAGE: 'question_type:manage',
  MATERIAL_MANAGE: 'material:manage',
  EXAM_MANAGE: 'exam:manage',
  SCORE_VIEW: 'score:view',
  GRADING_REVIEW: 'grading:review',
  ADMIN_MANAGE: 'admin:manage',
  DASHBOARD_VIEW: 'dashboard:view'
} as const;

export const PERMISSION_NAMES: Record<string, string> = {
  'subject:manage': '科目管理',
  'question:manage': '题目管理',
  'question_type:manage': '题型管理',
  'material:manage': '资料管理',
  'exam:manage': '考试配置管理',
  'score:view': '成绩查看',
  'grading:review': '主观题评阅',
  'admin:manage': '管理员管理',
  'dashboard:view': '仪表盘查看'
};

export const ROLE_CODES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TEACHER: 'teacher'
} as const;

export const ROLE_NAMES: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  teacher: '教师'
};
