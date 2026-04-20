# 05 — Dev Guide

## Prerequisites
- Node.js 18+
- npm

## Init Steps
```bash
# 1. Create project with Vite
npm create vite@latest exam-admin -- --template react-ts

# 2. Install dependencies
cd exam-admin
npm install

# 3. Install shadcn/ui
npx shadcn@latest init
# Choose: New York style, Neutral color, CSS variables

# 4. Install shadcn/ui components
npx shadcn@latest add button card table dialog input select badge tabs chart pagination skeleton toast

# 5. Install additional dependencies
npm install react-router-dom@7 recharts @tanstack/react-table react-hook-form @hookform/resolvers zod lucide-react

# 6. Start dev server
npm run dev
```

## Config Files

### package.json (key dependencies)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "recharts": "^2.15.0",
    "@tanstack/react-table": "^8.20.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    "lucide-react": "^0.468.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### .env.local (development)
```
VITE_API_BASE_URL=https://exam-server.onrender.com/api
```

### .env.production
```
VITE_API_BASE_URL=https://exam-server.onrender.com/api
```

## Component Patterns

### SidebarLayout (authenticated page wrapper)
```tsx
function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={logout} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

### StatCard (dashboard stat display)
```tsx
function StatCard({ title, value, icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
```

### DataTable (generic paginated table)
```tsx
function DataTable({ columns, data, pagination, onPaginationChange }) {
  // Uses TanStack Table with shadcn/ui Table component
  // Supports sorting, filtering, pagination
}
```

## Routing
```tsx
// router.tsx
const routes = [
  { path: '/login', element: <LoginPage />, noAuth: true },
  { path: '/', element: <SidebarLayout><DashboardPage /></SidebarLayout> },
  { path: '/questions', element: <SidebarLayout><QuestionsPage /></SidebarLayout> },
  { path: '/case-analysis', element: <SidebarLayout><CaseAnalysisPage /></SidebarLayout> },
  { path: '/practice', element: <SidebarLayout><PracticePage /></SidebarLayout> },
  { path: '/scores', element: <SidebarLayout><ScoresPage /></SidebarLayout> },
  { path: '/progress', element: <SidebarLayout><ProgressPage /></SidebarLayout> },
  { path: '/exams', element: <SidebarLayout><ExamsPage /></SidebarLayout> },
  { path: '/users', element: <SidebarLayout><UsersPage /></SidebarLayout> },
];
```

## Auth Implementation
```tsx
// contexts/AuthContext.tsx
function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      authApi.getMe().then(res => setUser(res.data));
    } else {
      localStorage.removeItem('admin_token');
      setToken(null);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('admin_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}
```

## Test Strategy
- No backend tests needed (all logic is in exam-server)
- Component tests: Vitest + React Testing Library for key pages
- E2E: Optional (Playwright), not priority for admin tool

## Deployment
- Vercel auto-deploy on push to main
- Build: `npm run build` → dist/ → Vercel serves as static SPA
- Vercel.json rewrites all routes to index.html (SPA routing)