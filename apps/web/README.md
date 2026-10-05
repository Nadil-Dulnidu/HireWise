# HireWise Web Portal (`apps/web`)

> **React 18 & Vite Client** — Modern management dashboard for Recruiters, Interviewers, and Platform Administrators on the HireWise AI recruitment platform.

---

## 🏛️ Architecture Overview

The web portal is built with React 18, TypeScript, and Vite:

- **UI & Design System**: Tailwind CSS with [shadcn/ui](https://ui.shadcn.com/) (accessible Radix UI primitives), Lucide React icons, and Dark/Light theme toggle.
- **State & Caching**: TanStack Query (React Query v5) for server state management, optimistic updates, and cache invalidation. Redux Toolkit for local UI state.
- **Routing**: React Router v7 with layout-based nested routes and declarative role guards (`ProtectedRoute`).
- **Authentication**: `@clerk/clerk-react` with pre-built `<OrganizationSwitcher />`, `<CreateOrganization />`, and custom onboarding workflows.
- **Charts & Metrics**: shadcn/ui Charts (Recharts wrapper) for recruitment funnel velocities and evaluation distributions.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- `npm` or `pnpm`
- Running HireWise Backend API (`apps/api`) at `http://localhost:5101`

### Configuration
Create `.env` based on `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:5101
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

### Installation & Local Execution
```bash
cd apps/web
npm install
npm run dev
```

Application runs on `http://localhost:5173`.

---

## 🧪 Testing & Quality

Run unit and component tests:
```bash
cd apps/web
npm run test
```

Build production bundle:
```bash
npm run build
```

Run ESLint:
```bash
npm run lint
```

---

## 📱 Role Boundaries
- **Recruiters & Admins**: Create organizations, post jobs, review AI candidate rankings, approve workflows, and schedule interview rounds.
- **Interviewers**: Access assigned interviews, view candidate resumes, utilize AI-suggested questions, and submit structured evaluation rubrics.
- **Candidates**: Candidates utilize the dedicated Flutter Mobile Client (`apps/mobile`), while retaining access to the public job board on the web.

---

## 📚 Related Documentation
- [System Architecture](../../docs/architecture.md)
- [API Reference](../../docs/api.md)
- [Live Demo Script](../../docs/demo_script.md)
- [Candidate Mobile Implementation Plan](../../docs/mobile/implementation_plan.md)
