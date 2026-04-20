# 04 — API Client Design

## Base Client (api/client.ts)

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://exam-server.onrender.com/api';

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers as Record<string, string> },
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data: ApiResponse<T> = await response.json();

  if (data.code !== 200 && data.code !== 201) {
    throw new Error(data.message || 'API Error');
  }

  return data;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
```

## API Modules

### api/auth.ts
```typescript
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { name, email, password, role: 'admin' }),
  getMe: () => api.get<User>('/auth/me'),
};
```

### api/questions.ts
```typescript
export const questionsApi = {
  list: (examId: string) => api.get<QuestionListData>(`/questions?examId=${examId}`),
  getById: (id: number) => api.get<Question>(`/questions/${id}`),
  create: (data: QuestionCreateRequest) => api.post<Question>('/admin/questions', data),
  update: (id: number, data: Partial<QuestionCreateRequest>) => api.put<Question>(`/admin/questions/${id}`, data),
  delete: (id: number) => api.delete<null>(`/admin/questions/${id}`),
  batchImport: (questions: QuestionCreateRequest[]) => api.post<{ created: number }>('/admin/questions/batch', questions),
  stats: (examId: string) => api.get<QuestionStats>(`/questions/stats?examId=${examId}`),
};
```

### api/scores.ts
```typescript
export const scoresApi = {
  list: (examId: string, page: number, pageSize: number) =>
    api.get<ScoreListData>(`/admin/scores/list?examId=${examId}&page=${page}&pageSize=${pageSize}`),
  stats: (examId: string) => api.get<ScoreStatsData>(`/admin/scores/stats?examId=${examId}`),
};
```

### api/exams.ts, api/case-analysis.ts, api/practice.ts, api/progress.ts
Similar pattern, each wrapping the corresponding exam-server endpoints.

## useApi Hook

```typescript
function useApi<T>(apiCall: () => Promise<ApiResponse<T>>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiCall()
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, refetch: () => { setLoading(true); apiCall().then(...) } };
}
```

## Error Handling
- All API errors caught by useApi hook → set error state
- Component shows error message via toast notification
- 401 errors → auto logout + redirect to /login (handled in client.ts)
- Network errors (Render sleeping) → show "正在连接服务器，请稍候..." message