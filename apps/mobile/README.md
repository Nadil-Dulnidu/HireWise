# HireWise Mobile — Candidate Portal

The official Flutter mobile application for **candidates** on the **HireWise** AI-Powered Tech Recruitment & Interview Scheduling Platform.

> **Important**: This mobile application is strictly tailored for **Candidates**. Recruiters, Interviewers, and Platform Administrators utilize the HireWise Web Portal (`apps/web`).

---

## 📱 Features

1. **Candidate Authentication & Security**:
   - Integrated with Clerk Authentication (`clerk_flutter`).
   - Automatic JWT token retrieval and injection into REST API headers (`Authorization: Bearer <token>`) and SignalR WebSockets (`?access_token=<token>`).
   - Role guard: Users authenticated with non-candidate roles (Recruiter, Interviewer, Admin) are immediately directed to an `UnauthorizedScreen` advising them to access the Web Portal.
   - Candidate confidentiality: Strict data exclusion ensuring interview questions, interviewer feedback, and internal scores are never exposed.

2. **Onboarding Flow**:
   - First-time candidate profile setup (phone number, headline/summary, technical skills).
   - Seamless onboarding completion synced to the backend database.

3. **Dashboard & Activity Overview**:
   - Personalized candidate greeting and headline.
   - High-level metrics: Active Applications, Upcoming Interviews, and Unread Notifications.
   - Quick action shortcuts (Search Jobs, My Applications, Interviews, Upload Resume).
   - Upcoming interview reminder cards and recent application status chips.

4. **Job Discovery & Application**:
   - Search published jobs by keyword and title.
   - Multi-criteria filter sheet: Department, Location, Employment Type (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`), Experience Level (`ENTRY`, `MID`, `SENIOR`, `LEAD`), Remote Only toggle, and Minimum Salary.
   - Comprehensive job detail view with role requirements, salary ranges, benefits, and company metadata.
   - In-app job application submission with cover letter and active resume attachment.

5. **Application Lifecycle Tracking**:
   - Complete list of submitted applications with color-coded status badges (`APPLIED`, `AI_REVIEW`, `RECRUITER_REVIEW`, `INTERVIEW_SCHEDULED`, `SELECTED`, etc.).
   - Interactive visual status timeline displaying progress from submission through evaluation.
   - Application withdrawal with confirmation dialog.

6. **Interview Schedule & Details**:
   - Filterable view for Upcoming and Past candidate interviews.
   - Detailed interview information: Date, time, duration, interview format (`TECHNICAL`, `BEHAVIORAL`, `SYSTEM_DESIGN`, `HR`), platform, and candidate-facing preparation instructions.
   - One-tap join button launching external meeting links (Google Meet / Zoom).

7. **Resume Management**:
   - File picker integration supporting PDF, DOC, and DOCX (up to 10MB).
   - View currently active resume with file size and upload date.
   - Upload new resume and soft-delete/replace active resumes.

8. **Profile & Settings**:
   - View profile details, avatar, and contact information.
   - Edit phone number, headline, and skill tags.
   - Sign out and session revocation via Clerk.

9. **Real-time Notifications**:
   - Real-time push updates powered by ASP.NET Core SignalR (`/hubs/notifications`).
   - In-app unread badge counter on home and notifications tab.
   - Mark individual notification as read or mark all notifications as read.
   - Direct navigation to relevant application or interview upon notification tap.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: Flutter 3.x / Dart 3.x
- **Design System**: Material Design 3 with HireWise brand blue (`#2563EB`) and dark mode support.
- **State Management**: [Riverpod](https://riverpod.dev/) (`flutter_riverpod`) with compile-safe, modular providers.
- **Navigation & Routing**: [GoRouter](https://pub.dev/packages/go_router) with reactive redirection guards for Auth, Onboarding, Role verification, and Tab Shells.
- **Network Client**: [Dio](https://pub.dev/packages/dio) with:
  - `AuthInterceptor`: Injects correlation ID (`X-Correlation-ID`) and Bearer JWT token.
  - `ErrorInterceptor`: Maps HTTP status codes to strongly-typed `AppException` and `ValidationException` classes.
- **Real-Time Communication**: [signalr_netcore](https://pub.dev/packages/signalr_netcore) for WebSocket duplex connection.
- **Authentication**: [clerk_flutter](https://pub.dev/packages/clerk_flutter) & [clerk_auth](https://pub.dev/packages/clerk_auth).

### Directory Layout

```
apps/mobile/
├── android/                   # Android native platform project & manifest
├── ios/                       # iOS native platform project
├── lib/
│   ├── app/                   # App root widget & ClerkAuth provider bridge
│   ├── core/
│   │   ├── config/            # Environment configuration (EnvConfig)
│   │   ├── constants/         # API endpoint paths
│   │   ├── errors/            # AppException, ErrorHandler, Failure definitions
│   │   ├── network/           # ApiClient, AuthInterceptor, ErrorInterceptor
│   │   ├── routing/           # AppRouter & GoRouter redirection guards
│   │   └── theme/             # Material 3 light & dark theme palettes
│   ├── features/
│   │   ├── applications/      # Applications list, details, apply, status timeline
│   │   ├── auth/              # Sign-in screen, unauthorized role screen, auth state
│   │   ├── home/              # Dashboard metrics, quick actions, recent events
│   │   ├── interviews/        # Interview schedule, detail, meeting link launcher
│   │   ├── jobs/              # Job search, multi-filter sheet, job detail
│   │   ├── notifications/     # Real-time notifications, SignalR client service
│   │   ├── onboarding/        # First-time candidate setup wizard
│   │   ├── profile/           # Profile view, edit profile form, skills editor
│   │   ├── resume/            # Resume upload sheet, resume card, file picker
│   │   └── shell/             # 5-tab persistent bottom navigation scaffold
│   ├── shared/
│   │   ├── models/            # ApiResponse, PagedResult, Enums
│   │   ├── utils/             # DateFormatter, CurrencyFormatter
│   │   └── widgets/           # StatusBadge, EmptyState, ErrorView, LoadingIndicator
│   └── main.dart              # Application entrypoint
├── test/                      # Comprehensive unit and widget tests (36+ tests)
├── env.development.json       # Development environment configuration
├── env.json.example           # Template for environment variables
└── pubspec.yaml               # Flutter package specification
```

---

## 🚀 Getting Started

### Prerequisites

1. [Flutter SDK](https://docs.flutter.dev/get-started/install) (version `>=3.3.0`)
2. Android Studio / Xcode / VS Code with Flutter extension
3. Running HireWise API (`apps/api`) at `http://localhost:5101` (or `http://10.0.2.2:5101` on Android Emulator)
4. Clerk publishable key from your Clerk dashboard

### Environment Configuration

Create or update `apps/mobile/env.development.json`:

```json
{
  "API_BASE_URL": "http://10.0.2.2:5101/api",
  "CLERK_PUBLISHABLE_KEY": "pk_test_your_clerk_key_here"
}
```

> **Note for Android Emulator**: Use `http://10.0.2.2:5101/api` to connect to the host machine's ASP.NET Core API.
> **Note for iOS Simulator**: Use `http://localhost:5101/api`.
> **Note for Physical Device**: Use your local machine's LAN IP, e.g., `http://192.168.1.100:5101/api`.

### Installation

```bash
cd apps/mobile
flutter pub get
```

### Running the App

Run on your connected device or emulator with the development configuration:

```bash
flutter run --dart-define-from-file=env.development.json
```

Or run in **production / release mode**:

```bash
flutter run --release --dart-define-from-file=env.production.json
```

### Production Builds

Generate release binaries for distribution:

- **Android APK** (Direct installation or testing):
  ```bash
  flutter build apk --release --dart-define-from-file=env.production.json
  ```
  Artifact location: `build/app/outputs/flutter-apk/app-release.apk`

- **Android App Bundle** (Google Play Store):
  ```bash
  flutter build appbundle --release --dart-define-from-file=env.production.json
  ```
  Artifact location: `build/app/outputs/bundle/release/app-release.aab`

- **iOS Archive / IPA** (macOS required):
  ```bash
  flutter build ipa --release --dart-define-from-file=env.production.json
  ```


---

## 🧪 Testing & Code Quality

### Static Analysis
Ensure code meets strict Flutter linting standards:

```bash
flutter analyze
```

### Formatting Check
```bash
dart format --output=none --set-exit-if-changed .
```

### Run Unit and Widget Tests
Execute all unit and widget tests:

```bash
flutter test
```

Generate test coverage:
```bash
flutter test --coverage
```
