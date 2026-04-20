# 02 — Feature Design

## Page 1: Login (/login)

### Data Interface
```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  code: number;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      role: "admin";
    };
  };
  message: string;
}
```

### UI
- 左侧品牌区域（考试系统名称 + 描述）
- 右侧登录表单（邮箱 + 密码 + 登录按钮）
- 登录成功 → JWT 存 localStorage → 跳转 /dashboard
- 登录失败 → 显示错误提示

## Page 2: Dashboard (/dashboard)

### Data Interface
```typescript
interface DashboardData {
  totalQuestions: number;
  totalChoice: number;
  totalJudgment: number;
  totalSubmissions: number;
  averageScore: number;
  maxScore: number;
  recentSubmissions: ExamScore[];
  scoreDistribution: Record<string, number>;
}
```

### UI
- 4个统计卡片（题目总数、提交次数、平均分、最高分）
- 分数分布柱状图（Chart.js / Recharts）
- 最近提交列表（5条）

## Page 3: Question Management (/questions)

### Data Interface
```typescript
interface QuestionListResponse {
  code: number;
  data: {
    info: { title: string; totalChoice: number; totalJudgment: number };
    choiceQuestions: Question[];
    judgmentQuestions: Question[];
  };
}

interface Question {
  id: number;
  type: "choice" | "judgment";
  category: string | null;
  question: string;
  options: { key: string; text: string }[] | null;
  answer: string;
  explanation: string | null;
}

interface QuestionCreateRequest {
  type: "choice" | "judgment";
  category?: string;
  examId: string;
  question: string;
  options?: { key: string; text: string }[];
  answer: string;
  explanation?: string;
}
```

### UI
- 筛选栏：题型(选择题/判断题)、分类、关键词搜索
- 数据表格（TanStack Table）：ID、题型、题目(截断)、分类、答案、操作
- 操作：查看详情、编辑、删除
- 新增按钮 → 弹出表单对话框
- 批量导入按钮 → JSON文件上传对话框
- 分页控件

## Page 4: Case Analysis (/case-analysis)

### Data Interface
```typescript
interface CaseAnalysisListResponse {
  code: number;
  data: {
    info: { totalCaseAnalysis: number };
    caseAnalysis: CaseAnalysisItem[];
  };
}

interface CaseAnalysisItem {
  id: number;
  title: string;
  sections: { title: string; content?: string; items: { subtitle: string; text: string }[] }[];
}
```

### UI
- 卡片列表展示案例分析
- 点击卡片 → 编辑表单（sections JSON编辑器）
- 新增/删除按钮

## Page 5: Practice Management (/practice)

### Data Interface
```typescript
interface PracticeListResponse {
  code: number;
  data: {
    info: { totalPractice: number };
    baseSteps: BaseSteps;
    practiceTasks: PracticeTask[];
  };
}

interface PracticeTask {
  id: number;
  title: string;
  type: string;
  description?: string;
  sourcePath?: string;
  output?: string;
  preSteps?: Step[];
  steps?: Step[];
  subTasks?: SubTask[];
}

interface Step {
  step?: number;
  action: string;
  detail?: string;
  command?: string;
  commands?: string[];
  example?: string;
  note?: string;
}
```

### UI
- BaseSteps 编辑区域（前置准备步骤）
- PracticeTask 列表 + CRUD
- 步骤编辑器（可逐条添加/删除/排序步骤）

## Page 6: Score Statistics (/scores)

### Data Interface
```typescript
interface ScoreStatsResponse {
  code: number;
  data: {
    averageScore: number;
    maxScore: number;
    minScore: number;
    totalSubmissions: number;
    scoreDistribution: Record<string, number>;
  };
}

interface ScoreListResponse {
  code: number;
  data: {
    items: ExamScoreItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

interface ExamScoreItem {
  id: number;
  userId: string;
  examId: string;
  choiceCorrect: number;
  choiceTotal: number;
  judgmentCorrect: number;
  judgmentTotal: number;
  totalScore: number;
  submittedAt: string;
}
```

### UI
- 统计概览卡片（平均分、最高分、提交数）
- 分数分布图（柱状图）
- 成绩列表表格（分页、可按分数排序）
- 导出按钮（CSV下载）

## Page 7: Exam Config (/exams)

### Data Interface
```typescript
interface ExamConfig {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
}

interface ExamConfigListResponse {
  code: number;
  data: ExamConfig[];
}
```

### UI
- 考试项目列表 + CRUD
- 启用/禁用开关
- 统计信息展示（该考试下的题目数、提交数）

## Page 8: User Management (/users)

### Data Interface
```typescript
interface UserListResponse {
  code: number;
  data: User[];
}

interface User {
  id: string;
  name?: string;
  email?: string;
  role: "admin" | "student";
  createdAt: string;
}
```

### UI
- 用户列表表格
- 新增管理员按钮
- 删除用户按钮