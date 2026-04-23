export const QUESTION_TYPE_NAMES = {
  CHOICE: 'choice',
  MULTI_CHOICE: 'multi_choice',
  JUDGMENT: 'judgment',
  FILL_BLANK: 'fill_blank',
  MATERIAL: 'material'
} as const;

export const QUESTION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  choice: '单选题',
  multi_choice: '多选题',
  judgment: '判断题',
  fill_blank: '填空题',
  material: '材料题'
};

export const SCORING_TYPES = {
  AUTO: 'auto',
  MIXED: 'mixed'
} as const;

export const SCORING_TYPE_NAMES: Record<string, string> = {
  auto: '自动评分',
  mixed: '混合评分'
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
} as const;

export const DIFFICULTY_NAMES: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
};
