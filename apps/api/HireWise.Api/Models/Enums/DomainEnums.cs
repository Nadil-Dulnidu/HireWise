namespace HireWise.Api.Models.Enums;

public enum UserRole
{
    ADMIN,
    RECRUITER,
    INTERVIEWER,
    CANDIDATE
}

public enum UserStatus
{
    ONBOARDING,
    ACTIVE,
    INACTIVE
}

public enum JobStatus
{
    DRAFT,
    OPEN,
    PAUSED,
    CLOSED
}

public enum EmploymentType
{
    FULL_TIME,
    PART_TIME,
    CONTRACT,
    INTERNSHIP
}

public enum ExperienceLevel
{
    ENTRY,
    MID,
    SENIOR,
    LEAD
}

public enum ApplicationStatus
{
    APPLIED,
    AI_REVIEW,
    AI_RECOMMENDED,
    RECRUITER_REVIEW,
    INTERVIEW_APPROVED,
    INTERVIEW_SCHEDULED,
    INTERVIEW_COMPLETED,
    EVALUATION_PENDING,
    SELECTED,
    REJECTED
}

public enum InterviewStatus
{
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    NO_SHOW
}

public enum RecommendationType
{
    STRONG_HIRE,
    HIRE,
    NO_HIRE,
    STRONG_NO_HIRE
}

public enum QuestionCategory
{
    TECHNICAL,
    BEHAVIORAL,
    PROBLEM_SOLVING,
    PROJECT_BASED
}

public enum DifficultyLevel
{
    EASY,
    MEDIUM,
    HARD
}

public enum NotificationType
{
    APPLICATION_UPDATE,
    INTERVIEW_SCHEDULED,
    AI_EVALUATION_COMPLETE,
    APPROVAL_REQUIRED,
    FEEDBACK_SUBMITTED,
    GENERAL
}

public enum AiWorkflowStatus
{
    PENDING,
    IN_PROGRESS,
    AWAITING_APPROVAL,
    COMPLETED,
    FAILED
}

public enum AiStepStatus
{
    PENDING,
    IN_PROGRESS,
    COMPLETED,
    FAILED,
    SKIPPED
}

public enum StepApprovalStatus
{
    PENDING,
    APPROVED,
    REJECTED
}
