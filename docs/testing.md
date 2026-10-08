# HireWise — Testing Strategy & Verification Guide

> **Version:** 1.0.0  
> **Target Audience:** QA Engineers, Software Engineers, DevOps Engineers

---

## 1. Multi-Tier Testing Pyramid

HireWise enforces rigorous quality gates across all four applications in the monorepo:

```
        / \
       /   \     E2E Tests (Playwright)
      /-----\    Cross-service, Full User Journeys
     /       \   Integration Tests (xUnit, pytest, Flutter integration)
    /---------\  API contracts, DB migrations, LangGraph state flows
   /           \ Unit & Component Tests (xUnit, Vitest, pytest, Flutter test)
  /-------------\ Domain logic, Pydantic schemas, UI widgets, Providers
```

| Layer | Component | Test Framework | Scope & Focus |
|---|---|---|---|
| **Backend API** | `apps/api` | xUnit, Moq, FluentAssertions | Controllers, Services, EF Core mapping, Query Filters, JWT verification |
| **AI Service** | `apps/ai-service` | pytest, pytest-asyncio, httpx | LangGraph state transitions, Agent prompt schemas, validation rules, golden datasets |
| **Web Portal** | `apps/web` | Vitest, React Testing Library, Playwright | Component rendering, TanStack query caching, Clerk auth routing, Recruiter flows |
| **Mobile App** | `apps/mobile` | `flutter_test`, mocktail | Riverpod providers, Dio interceptors, GoRouter redirection, Candidate UI widgets |

---

## 2. Backend Testing (`apps/api`)

### 2.1 Scope & Test Structure
The `HireWise.Api.Tests` test project (`apps/api/HireWise.Api.Tests`) covers:
- **Request Validators**: FluentValidation rules for jobs, applications, interviews, availability, departments, and companies.
- **Entity Mappings**: AutoMapper profile transformation and calculation verification for users, jobs, departments, and companies.
- **Service Layer**: Business logic, soft-deletion, and conflict handling (e.g., `DepartmentService`, `PlatformSettingsService`) using EF Core In-Memory database.

### 2.2 Running Backend Tests
```bash
# From repository root:
make api-test

# Or from apps/api:
cd apps/api
dotnet test HireWise.sln --logger "console;verbosity=normal"
```

To run with code coverage:
```bash
cd apps/api
dotnet test HireWise.sln /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
```

---

## 3. AI Service Testing (`apps/ai-service`)

### 3.1 Scope & Test Structure
- **Pydantic Validation Tests**: Ensure LLM JSON responses conform strictly to defined schemas without extra or missing fields.
- **Node Execution Tests**: Test individual LangGraph nodes (`job_analysis_node`, `candidate_evaluation_node`) using mocked Vertex AI responses.
- **Golden Dataset Evals**: Verify that synthetic benchmark resumes receive reproducible and bias-free evaluation scores within expected variance limits.

### 3.2 Running AI Service Tests
```bash
cd apps/ai-service
poetry run pytest -v
# Or with standard venv:
pytest tests/ -v --asyncio-mode=auto
```

---

## 4. Web Portal Testing (`apps/web`)

### 4.1 Unit & Component Tests
- Verifies UI rendering, role-conditional navigation links, form validation, and TanStack query hooks:
```bash
cd apps/web
npm run test
```

### 4.2 End-to-End (E2E) Testing with Playwright
- Automates complete browser scenarios:
  1. Recruiter signs in, posts a job vacancy.
  2. Candidate submits an application.
  3. Recruiter approves evaluation and schedules interview.
```bash
cd apps/web
npx playwright test
```

---

## 5. Candidate Mobile App Testing (`apps/mobile`)

> [!NOTE]
> The complete testing strategy and execution plan for mobile development is detailed in [docs/mobile/implementation_plan.md](file:///c:/nadil-dulnidu/HireWise/docs/mobile/implementation_plan.md) (Phase 13-B.14).

### 5.1 Test Suites (36+ Unit & Widget Tests)
- **Model Deserialization Tests**: Confirms parsing of `ApiResponse<T>`, `JobDto`, `ApplicationDto`, and `CandidateDashboardDto`.
- **Interceptor Tests**: Verifies Bearer JWT injection in `AuthInterceptor` and status code translation in `ErrorInterceptor`.
- **Router Guard Tests**: Verifies that unauthenticated users are routed to `SignInScreen` and recruiters are routed to `UnauthorizedScreen`.
- **Widget Tests**: Verifies `JobCard`, `StatusTimeline`, `ResumeCard`, and candidate dashboard rendering.

### 5.2 Running Mobile Tests Locally
```bash
cd apps/mobile
# 1. Run static analysis
flutter analyze

# 2. Run unit and widget test suite
flutter test

# 3. Generate coverage
flutter test --coverage
```

---

## 6. Monorepo Makefile Commands

Run top-level test suites directly from the repository root:

```bash
# Run backend API tests
make api-test

# Run all mobile tests and analysis
make mobile-analyze
make mobile-test

# Format validation
make mobile-format
```

---

## 7. CI Pipeline Quality Gates

Every pull request triggers automated GitHub Actions workflows:

1. **`.github/workflows/ci.yml`**:
   - Backend: `dotnet build` + `dotnet test`
   - AI Service: `pytest tests/`
   - Web Client: `npm run lint` + `npm run build`
2. **`.github/workflows/flutter.yml`**:
   - `flutter pub get`
   - `flutter analyze` (Zero analyzer errors required)
   - `flutter test` (All 36+ tests must pass)
