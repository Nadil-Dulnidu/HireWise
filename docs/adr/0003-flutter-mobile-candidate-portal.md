# ADR-0003: Dedicated Flutter Mobile Candidate Application

> **Status:** Accepted  
> **Date:** 2026-09-20  
> **Deciders:** System Architecture Team, Mobile Guild  
> **Related Documentation:** [docs/mobile/implementation_plan.md](file:///c:/nadil-dulnidu/HireWise/docs/mobile/implementation_plan.md)

---

## Context

Technical recruitment platforms often fail candidates on mobile devices due to non-responsive desktop web layouts, awkward resume upload dialogs, and clunky interview coordination. Candidates need an on-the-go experience for discovering jobs, tracking application statuses in real time, managing resumes, and joining video interviews.

Conversely, Recruiters and Interviewers perform heavy operational tasks—such as reviewing 50-page candidate evaluations, authoring job specifications, and configuring complex AI parameters—that are fundamentally suited to large-screen desktop browsers.

We needed a strategy to deliver a candidate mobile experience without bloating the application with complex recruiter views or duplicating backend business logic.

## Decision

We decided to implement a **dedicated Flutter mobile application (`apps/mobile`) exclusively for Candidates** (Phase 13-B):

1. **Candidate-Only Role Boundary**:
   - The Flutter mobile app is strictly restricted to candidate users.
   - If a user with role `RECRUITER`, `INTERVIEWER`, or `ADMIN` logs into the mobile app, `RoleGuard` immediately halts navigation and displays an `UnauthorizedScreen` instructing them to use the Web Portal.
2. **Confidentiality Perimeter**:
   - Candidate endpoints and mobile UI models strictly omit internal AI evaluation scores, match percentages, recruiter notes, and interviewer question banks.
3. **No Backend Redesign**:
   - The mobile client consumes the existing ASP.NET Core REST API using standard Clerk Bearer JWTs.
   - Only **one non-breaking backend endpoint** was added: `GET /api/users/me/dashboard`, which aggregates candidate application counts, upcoming interviews, unread notifications, and open jobs into a single roundtrip.
4. **Technical Stack**:
   - **Framework**: Flutter 3.x / Dart 3.x
   - **State Management**: **Riverpod** (`flutter_riverpod`) for compile-safe, modular state.
   - **Routing**: **GoRouter** with declarative redirect guards (`AuthGuard`, `RoleGuard`, `OnboardingGuard`).
   - **Networking**: **Dio** with `AuthInterceptor` (JWT Bearer injection) and `ErrorInterceptor` (typed `AppException` mapping).
   - **Real-Time**: `signalr_netcore` connected to `/hubs/notifications`.
   - **Testing**: Comprehensive 36+ unit and widget tests with CI in `.github/workflows/flutter.yml`.

## Consequences

### Positive
- **Frictionless Candidate Experience**: Native performance, responsive bottom navigation, interactive status timelines, and one-tap video interview joining.
- **Data Protection**: Clear separation guarantees zero accidental leak of confidential interview questions or recruiter scoring to candidates.
- **Rapid Delivery**: Reused 100% of existing backend services, database schemas, and Clerk authentication infrastructure without architectural rework.
- **Documented Execution**: A dedicated, 18-phase implementation plan was executed and documented in `docs/mobile/implementation_plan.md`.

### Negative / Trade-offs
- Two client repositories (`apps/web` and `apps/mobile`) must be maintained in sync when shared data contracts (e.g. `JobDto`, `ApplicationDto`) evolve.
- Flutter Native Clerk SDK requires native configuration in `android/` and `ios/`.
