# HireWise

> **AI-Powered Tech Recruitment & Interview Scheduling Platform**

HireWise is a comprehensive recruitment automation platform that streamlines technical hiring through AI-driven candidate screening, automated interview scheduling, real-time feedback workflows, and modern multi-client interfaces.

---

## 🏛️ Architecture Overview

The platform is structured as a monorepo consisting of four core components:

| Component | Path | Technology | Primary Audience | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `apps/api` | ASP.NET Core 8 (.NET 8), EF Core, PostgreSQL, SignalR | All clients & services | Core REST API, business logic, multi-tenant persistence, real-time notification hubs. |
| **Web Portal** | `apps/web` | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui, TanStack Query | Recruiters, Interviewers, Admins | Management dashboard for posting jobs, reviewing evaluations, scheduling rounds, and administrative control. |
| **Mobile App** | `apps/mobile` | Flutter 3, Dart, Riverpod, GoRouter, Dio, SignalR | **Candidates Only** | Dedicated mobile application for candidates to discover jobs, submit applications, manage resumes, track status, and view interview details. |
| **AI Service** | `apps/ai-service` | Python 3.11, FastAPI, LangGraph, Google Vertex AI (Gemini) | Backend API | Intelligent resume parsing, semantic scoring, question generation, and candidate evaluation agents. |

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) & `pnpm` / `npm`
- [Python 3.11+](https://www.python.org/)
- [Flutter SDK 3.x](https://docs.flutter.dev/get-started/install) (for mobile app)
- [Docker & Docker Compose](https://www.docker.com/) (for PostgreSQL and local services)

---

### Running the Services

#### 1. Backend API (`apps/api`)
```bash
cd apps/api/HireWise.Api
dotnet restore
dotnet run
```
API runs on `http://localhost:5101` (Swagger UI at `/swagger`).

#### 2. Web Portal (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```
Web app runs on `http://localhost:5173`.

#### 3. AI Service (`apps/ai-service`)
```bash
cd apps/ai-service
poetry install  # or pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 4. Candidate Mobile App (`apps/mobile`)
```bash
cd apps/mobile
flutter pub get
flutter run --dart-define-from-file=env.development.json
```
For Android emulator, `API_BASE_URL` is configured to `http://10.0.2.2:5101/api`.

---

## 📱 Mobile Application (Phase 13-B)

The Flutter mobile application (`apps/mobile`) is designed specifically for **Candidates** with:
- **Clerk Authentication**: Bearer JWT token propagation across all REST and SignalR calls.
- **Candidate-Only Role Guard**: Automatic redirection of non-candidate accounts to the web portal with zero exposure of sensitive hiring data (internal evaluations, scores, question banks).
- **Live Notifications**: Real-time push updates via SignalR WebSockets.
- **Clean Architecture**: Modular feature structure powered by Riverpod state management and GoRouter redirection guards.

For detailed documentation, see the [Mobile Readme](apps/mobile/README.md).

---

## 🛠️ Monorepo Makefile Commands

Run top-level Makefile tasks from the root directory:

```bash
# Mobile Tasks
make mobile-install   # Run flutter pub get
make mobile-analyze   # Run flutter analyze
make mobile-test      # Run unit and widget test suite
make mobile-format    # Run dart format check
make mobile-run       # Run Flutter app in development mode
```

---

## 🔒 Security & Privacy

- All endpoints authenticate using Clerk-issued JWTs with RS256 JWKS verification.
- Sensitive interviewer scoring and private recruiter notes are strictly filtered from all candidate-facing endpoints and mobile screens.
- SignalR connection tokens are securely verified before granting access to real-time notification streams.
