# 03 — Architecture

## Tech Stack
| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | Vue | 3.x | SoybeanAdmin内置 |
| Language | TypeScript | 5.x | SoybeanAdmin内置 |
| Build | Vite | 7.x | SoybeanAdmin内置 |
| UI Library | Element Plus | latest | SoybeanAdmin ElPlus版本 |
| CSS | UnoCSS | latest | SoybeanAdmin内置（替代Tailwind） |
| State | Pinia | latest | SoybeanAdmin内置 |
| Routing | Elegant Router | latest | SoybeanAdmin文件路由自动生成 |
| HTTP Client | Axios | latest | SoybeanAdmin内置 |
| Auth | JWT (localStorage) | — | SoybeanAdmin内置auth store |
| Charts | ECharts | latest | SoybeanAdmin内置 |
| Icons | Iconify | latest | SoybeanAdmin内置 |
| Package Manager | pnpm | 10.5+ | monorepo要求 |

## Directory Tree
```
exam-admin/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx                # Route definitions with auth guard
│   ├── api/
│   │   ├── client.ts             # Base fetch wrapper + JWT interceptor
│   │   ├── questions.ts
│   │   ├── auth.ts
│   │   ├── scores.ts
│   │   ├── exams.ts
│   │   ├── progress.ts
│   │   ├── case-analysis.ts
│   │   ├── practice.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SidebarLayout.tsx  # Sidebar + content area wrapper
│   │   │   ├── Sidebar.tsx        # Nav links with icons
│   │   │   ├── Header.tsx         # Top bar with user info + logout
│   │   │   └── Breadcrumb.tsx
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── chart.tsx         # Recharts wrapper
│   │   │   ├── pagination.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ... (as needed)
│   │   ├── shared/
│   │   │   ├── StatCard.tsx      # Dashboard stat card
│   │   │   ├── DataTable.tsx     # Generic data table with pagination
│   │   │   ├── ConfirmDialog.tsx # Delete confirmation
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   ├── pages/
│   │   ├── login/
│   │   │   ├── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   ├── questions/
│   │   │   ├── QuestionsPage.tsx
│   │   │   ├── QuestionForm.tsx  # Create/Edit form dialog
│   │   │   ├── BatchImport.tsx   # JSON import dialog
│   │   ├── case-analysis/
│   │   │   ├── CaseAnalysisPage.tsx
│   │   ├── practice/
│   │   │   ├── PracticePage.tsx
│   │   ├── scores/
│   │   │   ├── ScoresPage.tsx
│   │   │   ├── ScoreChart.tsx
│   │   ├── progress/
│   │   │   ├── ProgressPage.tsx
│   │   ├── exams/
│   │   │   ├── ExamsPage.tsx
│   │   ├── users/
│   │   │   ├── UsersPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts            # Auth state, login, logout
│   │   ├── useApi.ts             # Generic fetch hook with loading/error
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Auth provider
│   ├── lib/
│   │   ├── utils.ts              # cn() helper from shadcn/ui
│   │   ├── auth.ts               # JWT decode, isExpired, token storage
│   ├── types/
│   │   ├── question.ts
│   │   ├── user.ts
│   │   ├── score.ts
│   │   ├── exam.ts
│   │   ├── api.ts                # CommonResponse<T> type
│   ├── styles/
│   │   ├── globals.css           # Tailwind imports + custom styles
├── components.json               # shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── package.json
├── vercel.json
├── AGENTS.md
└── docs/
```

## Data Flow
```
User clicks button in exam-admin
  → React component calls api function
    → fetch wrapper adds JWT Bearer header
      → HTTP request to exam-server Render URL
        → exam-server validates JWT → processes request → returns JSON
          → fetch wrapper parses response
            → React hook updates state
              → Component re-renders with new data
                → Toast notification (success/error)
```

## Auth Flow
```
LoginPage → POST /api/auth/login → receive JWT → store in localStorage
  → AuthContext reads JWT → decode role → mark as authenticated
    → Router guard: if not authenticated → redirect to /login
    → SidebarLayout wraps all authenticated pages
      → Header shows user name + logout button
        → Logout → clear localStorage → redirect to /login

JWT expires → fetch wrapper detects 401 → clear token → redirect to /login
```

## Deployment
```
exam-admin → Vercel (Hobby free)
  → Static SPA build (npm run build → dist/)
  → Environment: VITE_API_BASE_URL = https://exam-server.onrender.com/api
  → Domain: exam-admin.vercel.app
  
Same Vercel account as exam frontend:
  Project 1: exam (user frontend)
  Project 2: exam-admin (admin backend)
  → Both are pure static, no serverless functions consumed
  → Share Edge Requests & bandwidth quotas
  → Each project's quota usage is minimal (admin is rarely used)
```