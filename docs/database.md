# HireWise — Database & Persistence Documentation

> **Version:** 1.0.0  
> **Database Engine:** PostgreSQL 16 (Google Cloud SQL / Supabase)  
> **ORM Framework:** Microsoft Entity Framework Core 8.0  
> **Target Audience:** Backend Engineers, Database Administrators, Security Auditors

---

## 1. Overview & Architectural Principles

The HireWise data architecture is built around three core design tenets:
1. **Multi-Tenant Segregation**: Shared database with `CompanyId` scoping for organizational isolation (Recruiters, Interviewers, Jobs, Departments), paired with global candidate discovery.
2. **Auditability & Traceability**: Every mutating operation automatically generates immutable JSONB delta records in the `AuditLogs` table.
3. **Temporal Soft-Deletion**: Standard `BaseEntity` tracks timestamps and enables soft deletion (`IsDeleted`, `DeletedAt`), guarded by EF Core Global Query Filters.

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    Users ||--o{ Companies : "creates"
    Users ||--o{ Resumes : "owns"
    Users ||--o{ Applications : "submits"
    Users ||--o{ Interviews : "interviews (as candidate or interviewer)"
    Users ||--o{ InterviewFeedback : "authors"
    Users ||--o{ AvailabilitySlots : "declares"
    Users ||--o{ Notifications : "receives"
    Users ||--o{ AuditLogs : "triggers"

    Companies ||--o{ Departments : "contains"
    Companies ||--o{ Jobs : "publishes"
    Companies ||--o{ Users : "employs (as recruiter or interviewer)"

    Departments ||--o{ Jobs : "categorizes"

    Jobs ||--o{ Applications : "receives"
    Jobs ||--o{ Interviews : "schedules for"

    Applications ||--o| AiWorkflows : "triggers"
    Applications ||--o| Interviews : "advances to"

    AiWorkflows ||--o{ AiWorkflowSteps : "executes"

    Interviews ||--o| InterviewFeedback : "evaluates"
    Interviews ||--o{ InterviewQuestions : "tailors"

    Users {
        uuid Id PK
        string ClerkUserId UK
        string Email UK
        string FirstName
        string LastName
        string Role "CANDIDATE | RECRUITER | INTERVIEWER | ADMIN"
        string Status "ONBOARDING | ACTIVE | INACTIVE"
        uuid CompanyId FK "nullable"
        string ProfileImageUrl
        string Phone
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Companies {
        uuid Id PK
        string ClerkOrganizationId UK
        string Slug
        string Name
        string Description
        string LogoUrl
        string Website
        string Industry
        string Size
        string Location
        uuid CreatedByUserId FK
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Departments {
        uuid Id PK
        string Name
        string Description
        uuid CompanyId FK
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Jobs {
        uuid Id PK
        string Title
        string Description
        string Requirements
        string Location
        string EmploymentType "FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP"
        string ExperienceLevel "ENTRY | MID | SENIOR | LEAD"
        decimal SalaryMin
        decimal SalaryMax
        string SalaryCurrency
        string Status "DRAFT | OPEN | PAUSED | CLOSED"
        uuid CompanyId FK
        uuid DepartmentId FK
        uuid CreatedByUserId FK
        datetime ApplicationDeadline
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Resumes {
        uuid Id PK
        uuid CandidateId FK
        string FileUrl
        string FileName
        string FileType
        bigint FileSize
        datetime UploadedAt
        boolean IsActive
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Applications {
        uuid Id PK
        uuid JobId FK
        uuid CandidateId FK
        string Status "APPLIED | AI_REVIEW | AI_RECOMMENDED | RECRUITER_REVIEW | INTERVIEW_APPROVED | INTERVIEW_SCHEDULED | INTERVIEW_COMPLETED | EVALUATION_PENDING | SELECTED | REJECTED"
        string ResumeSnapshotUrl
        string CoverLetter
        uuid AiWorkflowId FK
        datetime AppliedAt
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Interviews {
        uuid Id PK
        uuid ApplicationId FK UK
        uuid InterviewerId FK
        uuid CandidateId FK
        uuid JobId FK
        datetime ScheduledStartTime
        datetime ScheduledEndTime
        string MeetingLink
        string GoogleCalendarEventId
        string Status "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW"
        string Notes
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    InterviewFeedback {
        uuid Id PK
        uuid InterviewId FK UK
        uuid InterviewerId FK
        int TechnicalSkillsRating "1-5"
        int ProblemSolvingRating "1-5"
        int CommunicationRating "1-5"
        int CulturalFitRating "1-5"
        decimal OverallRating
        string Recommendation "STRONG_HIRE | HIRE | NO_HIRE | STRONG_NO_HIRE"
        string Notes
        string Strengths
        string Weaknesses
        datetime SubmittedAt
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    InterviewQuestions {
        uuid Id PK
        uuid InterviewId FK
        uuid ApplicationId FK
        string Category "TECHNICAL | BEHAVIORAL | SYSTEM_DESIGN | PROBLEM_SOLVING | CULTURE"
        string Question
        string ExpectedAnswer
        string DifficultyLevel "EASY | MEDIUM | HARD"
        int OrderIndex
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    AvailabilitySlots {
        uuid Id PK
        uuid UserId FK
        int DayOfWeek "0-6"
        time StartTime
        time EndTime
        string Timezone
        boolean IsRecurring
        date SpecificDate
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    Notifications {
        uuid Id PK
        uuid UserId FK
        string Title
        string Message
        string Type "APPLICATION_STATUS | INTERVIEW_SCHEDULED | INTERVIEW_REMINDER | FEEDBACK_SUBMITTED | GENERAL"
        string ReferenceType
        uuid ReferenceId
        boolean IsRead
        datetime ReadAt
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    AiWorkflows {
        uuid Id PK
        uuid ApplicationId FK UK
        string Objective
        string CurrentStep
        string Status "PENDING | RUNNING | WAITING_FOR_APPROVAL | COMPLETED | FAILED"
        jsonb PlanJson
        jsonb CompletedStepsJson
        jsonb ErrorStateJson
        jsonb FinalResultJson
        datetime StartedAt
        datetime CompletedAt
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    AiWorkflowSteps {
        uuid Id PK
        uuid WorkflowId FK
        string AgentName
        string StepName
        int StepOrder
        string Status "PENDING | RUNNING | COMPLETED | FAILED | SKIPPED"
        jsonb InputJson
        jsonb OutputJson
        jsonb ValidationResultJson
        string ApprovalStatus "PENDING | APPROVED | REJECTED"
        uuid ApprovedByUserId FK
        datetime ApprovedAt
        string ApprovalNotes
        int RetryCount
        datetime StartedAt
        datetime CompletedAt
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }

    AuditLogs {
        uuid Id PK
        uuid UserId
        string Action
        string EntityType
        uuid EntityId
        string Role
        jsonb OldValuesJson
        jsonb NewValuesJson
        string IpAddress
        string CorrelationId
        datetime CreatedAt
    }

    PlatformSettings {
        uuid Id PK
        string Key UK
        string Value
        string Description
        string Category
        datetime CreatedAt
        datetime UpdatedAt
        boolean IsDeleted
        datetime DeletedAt
    }
```

---

## 3. Data Dictionary & Table Specifications

### 3.1 `Users`
Central identity mapping Clerk users to internal permissions and company affiliations.
- **Indexes:**
  - `IX_Users_ClerkUserId` (Unique)
  - `IX_Users_Email` (Unique)
  - `IX_Users_CompanyId` (B-Tree)
- **Soft Delete:** Enabled (`IsDeleted`, `DeletedAt`).

### 3.2 `Companies`
Represents an employer organization synchronized with Clerk Organizations.
- **Indexes:**
  - `IX_Companies_ClerkOrganizationId` (Unique)
  - `IX_Companies_Slug` (B-Tree)
  - `IX_Companies_Name` (B-Tree)

### 3.3 `Jobs`
Job vacancies published by Recruiters.
- **Indexes:**
  - `IX_Jobs_CompanyId` (B-Tree)
  - `IX_Jobs_DepartmentId` (B-Tree)
  - `IX_Jobs_Status` (B-Tree)
  - Composite: `IX_Jobs_Status_CompanyId` (Composite for query filtering)

### 3.4 `Applications`
Candidate submissions for specific jobs.
- **Constraints:**
  - `UX_Applications_JobId_CandidateId`: Unique index ensuring one application per candidate per job.
- **Indexes:**
  - `IX_Applications_CandidateId` (B-Tree)
  - `IX_Applications_Status` (B-Tree)

### 3.5 `AiWorkflows` & `AiWorkflowSteps`
Persistence for LangGraph state machines and Human-In-The-Loop approval gates.
- **Special Columns:** `PlanJson`, `CompletedStepsJson`, `ErrorStateJson`, `FinalResultJson` use native PostgreSQL `jsonb` indexing.

### 3.6 `AuditLogs`
Immutable ledger recording every database write operation.
- **Indexes:**
  - `IX_AuditLogs_UserId`
  - `IX_AuditLogs_EntityType`
  - `IX_AuditLogs_CreatedAt` (Descending)

---

## 4. Query Filtering & Tenant Scoping

EF Core configuration implements transparent tenant security:

```csharp
// Global Query Filter for Soft Delete across all BaseEntities
modelBuilder.Entity<Job>().HasQueryFilter(e => !e.IsDeleted);

// In Controllers / Repositories:
// Tenant scoping is enforced via ICurrentUserService.CompanyId:
if (currentUserService.Role == UserRole.RECRUITER)
{
    query = query.Where(j => j.CompanyId == currentUserService.CompanyId);
}
```

---

## 5. Database Migrations Guide

Entity Framework Core migrations manage schema versions.

### Generating a New Migration
```bash
cd apps/api/HireWise.Api
dotnet ef migrations add <MigrationName> --output-dir Migrations
```

### Applying Migrations Locally
```bash
dotnet ef database update
```

### Applying Migrations in CI/CD or Production
Migrations are automatically checked and applied upon startup via `DbInitializer.InitializeAsync()` in `Program.cs`. Alternatively, run the SQL script bundle:
```bash
dotnet ef migrations script --idempotent --output bundle.sql
```
