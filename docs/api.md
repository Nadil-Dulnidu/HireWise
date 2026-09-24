# HireWise — API Reference & Integration Guide

> **Base URL (Local API):** `http://localhost:5101`  
> **Base URL (Android Emulator):** `http://10.0.2.2:5101`  
> **Swagger UI:** `http://localhost:5101/swagger`  
> **Version:** 1.0.0

---

## 1. Authentication & Common Headers

All authenticated endpoints require an RS256 JWT issued by **Clerk**.

### Request Headers
| Header | Description | Required | Example |
|---|---|---|---|
| `Authorization` | Bearer Token issued by Clerk | Yes (for protected routes) | `Bearer eyJhbGciOiJSUzI1NiIs...` |
| `X-Correlation-ID` | Distributed tracing identifier | Recommended | `c0a8012e-8a2b-4fa8-b223-28f090b8332f` |
| `Content-Type` | Payload serialization format | For POST/PUT | `application/json` or `multipart/form-data` |
| `X-Internal-Key` | Internal callback key | Internal routes only | `hw_internal_callback_key` |

---

## 2. Standard Response Envelopes

### 2.1 Single Resource (`ApiResponse<T>`)
```json
{
  "success": true,
  "data": {
    "id": "18cfc5f5-f55a-4e2b-bbd4-65f5e7144e5a",
    "title": "Senior Cloud Engineer",
    "status": "OPEN"
  },
  "message": "Resource retrieved successfully.",
  "error": null,
  "timestamp": "2026-09-24T12:00:00Z",
  "correlationId": "c0a8012e-8a2b-4fa8-b223-28f090b8332f"
}
```

### 2.2 Paginated Resource (`ApiResponse<PagedResult<T>>`)
```json
{
  "success": true,
  "data": {
    "items": [ /* array of T */ ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 42,
    "totalPages": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "message": null,
  "error": null,
  "timestamp": "2026-09-24T12:00:00Z",
  "correlationId": "c0a8012e-8a2b-4fa8-b223-28f090b8332f"
}
```

### 2.3 Error Envelope
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": "The SalaryMin cannot exceed SalaryMax.",
  "timestamp": "2026-09-24T12:00:00Z",
  "correlationId": "c0a8012e-8a2b-4fa8-b223-28f090b8332f"
}
```

---

## 3. Endpoints by Subsystem

### 3.1 Users & Identity (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Authenticated | Returns current profile, role, status, and company metadata. |
| `PUT` | `/api/users/me` | Authenticated | Updates first name, last name, and phone number. |
| `PUT` | `/api/users/me/role` | Authenticated | Sets user role during initial onboarding. |
| `GET` | `/api/users/me/dashboard` | Candidate | **Mobile & Candidate Dashboard**: Aggregates active application counts, upcoming interviews, unread notifications, and open jobs. |
| `GET` | `/api/users` | Admin, Recruiter | Filter and list platform users (company-scoped for recruiters). |
| `GET` | `/api/users/{id}` | Admin, Recruiter | Retrieve user details by ID. |
| `PUT` | `/api/users/{id}/role` | Admin | Change another user's role. |
| `PUT` | `/api/users/{id}/status` | Admin | Change another user's status (`ACTIVE`, `INACTIVE`, `ONBOARDING`). |

---

### 3.2 Jobs & Vacancies (`/api/jobs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/jobs` | Anonymous / Authenticated | List jobs. Candidates & public users see published jobs only; Recruiters see company-scoped jobs including drafts. |
| `GET` | `/api/jobs/{id}` | Anonymous / Authenticated | Get detailed job posting with requirements, salary, and company profile. |
| `POST` | `/api/jobs` | Admin, Recruiter | Create a new job vacancy (`DRAFT` or `OPEN`). |
| `PUT` | `/api/jobs/{id}` | Admin, Recruiter | Update job details and requirements. |
| `DELETE` | `/api/jobs/{id}` | Admin, Recruiter | Soft-delete a job posting. |
| `PUT` | `/api/jobs/{id}/status` | Admin, Recruiter | Update status: `DRAFT`, `OPEN`, `PAUSED`, `CLOSED`. |

---

### 3.3 Applications & Tracking (`/api/applications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/jobs/{jobId}/applications` | Candidate | Submit application with cover letter and active resume snapshot. |
| `GET` | `/api/applications/me` | Candidate | List my applications with progress status. |
| `GET` | `/api/applications/{id}` | Authenticated | Application detail view. Sensitive interviewer notes are automatically masked for candidates. |
| `GET` | `/api/jobs/{jobId}/applications`| Admin, Recruiter | List all applications submitted to a specific job. |
| `GET` | `/api/applications` | Admin, Recruiter | Paged list of all applications for recruiter's company. |
| `PUT` | `/api/applications/{id}/status` | Admin, Recruiter | Update stage: `RECRUITER_REVIEW`, `INTERVIEW_APPROVED`, `SELECTED`, `REJECTED`. |
| `DELETE` | `/api/applications/{id}` | Candidate / Admin | Withdraw application. |

---

### 3.4 Resumes & Storage (`/api/resumes`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/resumes/upload` | Candidate | Upload PDF, DOC, or DOCX (max 10MB) to Google Cloud Storage. Automatically sets as candidate's active resume. |
| `GET` | `/api/resumes/me` | Candidate | Retrieve current active resume metadata and download URL. |
| `GET` | `/api/resumes/{id}` | Authenticated | Retrieve resume file details by ID. |
| `DELETE` | `/api/resumes/{id}` | Candidate | Deactivate and soft-delete resume. |

---

### 3.5 Interviews & Feedback (`/api/interviews`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/interviews` | Admin, Recruiter | Schedule interview round, assign interviewer, create Google Meet/Calendar event. |
| `GET` | `/api/interviews` | Admin, Recruiter, Interviewer | List company interviews with filters (date range, status). |
| `GET` | `/api/interviews/me` | Authenticated | List current user's interviews (as Candidate or assigned Interviewer). |
| `GET` | `/api/interviews/{id}` | Authenticated | Get interview meeting details and preparation guidelines. |
| `PUT` | `/api/interviews/{id}/status` | Admin, Recruiter, Interviewer | Update status: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. |
| `POST` | `/api/interviews/{id}/feedback`| Interviewer, Admin | Submit structured rubric (1–5 ratings, recommendation, notes). |
| `GET` | `/api/interviews/{id}/feedback`| Admin, Recruiter, Interviewer | View submitted evaluation feedback. (Forbidden for Candidates). |
| `GET` | `/api/interviews/{id}/questions`| Admin, Recruiter, Interviewer | Retrieve tailored AI-generated questions. (Forbidden for Candidates). |
| `POST` | `/api/interviews/{id}/questions`| Admin, Recruiter, Interviewer | Add custom question to interview question bank. |

---

### 3.6 AI Orchestration & Workflows (`/api/ai`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/ai/evaluations` | Admin, Recruiter | Get candidate rankings and AI match scores for a job. |
| `GET` | `/api/ai/workflows/{workflowId}` | Admin, Recruiter | Inspect LangGraph workflow state graph and step execution history. |
| `POST` | `/api/ai/workflows/start` | Admin, Recruiter | Manually trigger evaluation workflow for an application. |
| `POST` | `/api/ai/workflows/{workflowId}/approve` | Admin, Recruiter | **Approval Gate**: Human approval to proceed to question generation and scheduling. |
| `POST` | `/api/ai/workflows/{workflowId}/reject` | Admin, Recruiter | Reject AI recommendation. |
| `POST` | `/api/ai/workflows/{workflowId}/retry` | Admin, Recruiter | Retry a failed LangGraph step. |

---

### 3.7 Internal Callback (`/api/internal/ai-callback`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/internal/ai-callback` | Internal (`X-Internal-Key`) | Webhook endpoint called by FastAPI AI service when LangGraph completes evaluation or scheduling. Dispatches SignalR events. |

---

### 3.8 Real-Time Notifications (`/api/notifications` & `/hubs/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Paged in-app notifications. |
| `GET` | `/api/notifications/unread-count` | Authenticated | Fast scalar query for unread badge counters. |
| `PUT` | `/api/notifications/{id}/read` | Authenticated | Mark individual notification as read. |
| `PUT` | `/api/notifications/read-all` | Authenticated | Mark all notifications read for user. |
| `WS` | `/hubs/notifications` | Authenticated | **SignalR WebSocket Hub**: Receives real-time dispatches (`ReceiveNotification`, `NotificationCountUpdated`). Pass token as `?access_token=<JWT>`. |

---

### 3.9 Company & Department Management (`/api/companies`, `/api/departments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/companies` | Anonymous / Admin | List platform companies. |
| `GET` | `/api/companies/{id}` | Anonymous / Authenticated | Get company profile. |
| `GET` | `/api/companies/current` | Recruiter, Interviewer | Get current tenant company. |
| `POST` | `/api/companies` | Admin, Recruiter | Register company profile. |
| `PUT` | `/api/companies/{id}` | Admin, Recruiter | Update company profile. |
| `GET` | `/api/departments` | Authenticated | List departments in user's company. |
| `POST` | `/api/departments` | Admin, Recruiter | Create department. |
| `PUT` | `/api/departments/{id}` | Admin, Recruiter | Update department. |
| `DELETE` | `/api/departments/{id}` | Admin, Recruiter | Delete department. |

---

### 3.10 Admin, Audit Logs & Platform Settings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/auditlogs` | Admin | Query immutable database change logs with JSONB diffs. |
| `GET` | `/api/agent-configs` | Admin | List configurable AI agent system prompts, temperatures, and model choices. |
| `PUT` | `/api/agent-configs/{id}` | Admin | Tune agent parameters dynamically at runtime without service restarts. |
| `GET` | `/api/platform-settings` | Admin | Read global platform parameters. |
| `PUT` | `/api/platform-settings/{key}` | Admin | Update system parameters. |
| `GET` | `/api/analytics/dashboard` | Admin, Recruiter | Aggregated recruitment funnel and pipeline velocity metrics. |
| `POST` | `/api/webhooks/clerk` | Public / Verified | Receives user and organization synchronization events from Clerk. |
