using HireWise.Api.Models.Enums;

namespace HireWise.Api.Models;

// User account entity representing candidates, interviewers, recruiters, and admins
public class User : BaseEntity
{
    public string ClerkUserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.CANDIDATE;
    public UserStatus Status { get; set; } = UserStatus.ONBOARDING;
    public Guid? CompanyId { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Phone { get; set; }

    // Navigation properties
    public virtual Company? Company { get; set; }
    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
    public virtual ICollection<Resume> Resumes { get; set; } = new List<Resume>();
    public virtual ICollection<Interview> AssignedInterviews { get; set; } = new List<Interview>();
    public virtual ICollection<InterviewFeedback> SubmittedFeedbacks { get; set; } = new List<InterviewFeedback>();
    public virtual ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

// Company organization profile and employer account
public class Company : BaseEntity
{
    public string ClerkOrganizationId { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? Industry { get; set; }
    public string? Size { get; set; }
    public string? Location { get; set; }
    public Guid? CreatedByUserId { get; set; }

    // Navigation properties
    public virtual User? CreatedByUser { get; set; }
    public virtual ICollection<User> Employees { get; set; } = new List<User>();
    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
    public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();
}

// Department or team unit within a company
public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CompanyId { get; set; }

    // Navigation properties
    public virtual Company Company { get; set; } = null!;
    public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();
}

// Job vacancy listing published by a company
public class Job : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FULL_TIME;
    public ExperienceLevel ExperienceLevel { get; set; } = ExperienceLevel.MID;
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public JobStatus Status { get; set; } = JobStatus.DRAFT;
    public Guid CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime? ApplicationDeadline { get; set; }

    // Navigation properties
    public virtual Company Company { get; set; } = null!;
    public virtual Department? Department { get; set; }
    public virtual User CreatedByUser { get; set; } = null!;
    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
}

// Candidate uploaded resume document and metadata
public class Resume : BaseEntity
{
    public Guid CandidateId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual User Candidate { get; set; } = null!;
}

// Job application submitted by a candidate for an open job
public class Application : BaseEntity
{
    public Guid JobId { get; set; }
    public Guid CandidateId { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.APPLIED;
    public string? ResumeSnapshotUrl { get; set; }
    public string? CoverLetter { get; set; }
    public Guid? AiWorkflowId { get; set; }
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Job Job { get; set; } = null!;
    public virtual User Candidate { get; set; } = null!;
    public virtual AiWorkflow? AiWorkflow { get; set; }
    public virtual Interview? Interview { get; set; }
}

// Scheduled interview meeting between interviewer and candidate
public class Interview : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public Guid InterviewerId { get; set; }
    public Guid CandidateId { get; set; }
    public Guid JobId { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public string? MeetingLink { get; set; }
    public string? GoogleCalendarEventId { get; set; }
    public InterviewStatus Status { get; set; } = InterviewStatus.SCHEDULED;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Application Application { get; set; } = null!;
    public virtual User Interviewer { get; set; } = null!;
    public virtual User Candidate { get; set; } = null!;
    public virtual Job Job { get; set; } = null!;
    public virtual InterviewFeedback? Feedback { get; set; }
    public virtual ICollection<InterviewQuestion> Questions { get; set; } = new List<InterviewQuestion>();
}

// Evaluation scores and notes submitted by an interviewer
public class InterviewFeedback : BaseEntity
{
    public Guid InterviewId { get; set; }
    public Guid InterviewerId { get; set; }
    public int TechnicalSkillsRating { get; set; }
    public int ProblemSolvingRating { get; set; }
    public int CommunicationRating { get; set; }
    public int CulturalFitRating { get; set; }
    public decimal OverallRating { get; set; }
    public RecommendationType Recommendation { get; set; }
    public string? Notes { get; set; }
    public string? Strengths { get; set; }
    public string? Weaknesses { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Interview Interview { get; set; } = null!;
    public virtual User Interviewer { get; set; } = null!;
}

// Interview question item generated or assigned to an interview
public class InterviewQuestion : BaseEntity
{
    public Guid InterviewId { get; set; }
    public Guid? ApplicationId { get; set; }
    public QuestionCategory Category { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? ExpectedAnswer { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; } = DifficultyLevel.MEDIUM;
    public int OrderIndex { get; set; }

    // Navigation properties
    public virtual Interview Interview { get; set; } = null!;
}

// Weekly recurring or specific date availability time slot for an interviewer
public class AvailabilitySlot : BaseEntity
{
    public Guid UserId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Timezone { get; set; } = "UTC";
    public bool IsRecurring { get; set; } = true;
    public DateOnly? SpecificDate { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
}

// In-app notification message delivered to a user
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.GENERAL;
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
}

// Multi-step AI agent workflow tracking for candidate resume screening and processing
public class AiWorkflow : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public string Objective { get; set; } = string.Empty;
    public string CurrentStep { get; set; } = string.Empty;
    public AiWorkflowStatus Status { get; set; } = AiWorkflowStatus.PENDING;
    public string? PlanJson { get; set; }
    public string? CompletedStepsJson { get; set; }
    public string? ErrorStateJson { get; set; }
    public string? FinalResultJson { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual Application Application { get; set; } = null!;
    public virtual ICollection<AiWorkflowStep> Steps { get; set; } = new List<AiWorkflowStep>();
}

// Individual task or agent execution step within an AI workflow
public class AiWorkflowStep : BaseEntity
{
    public Guid WorkflowId { get; set; }
    public string AgentName { get; set; } = string.Empty;
    public string StepName { get; set; } = string.Empty;
    public int StepOrder { get; set; }
    public AiStepStatus Status { get; set; } = AiStepStatus.PENDING;
    public string? InputJson { get; set; }
    public string? OutputJson { get; set; }
    public string? ValidationResultJson { get; set; }
    public StepApprovalStatus? ApprovalStatus { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }
    public int RetryCount { get; set; } = 0;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual AiWorkflow Workflow { get; set; } = null!;
    public virtual User? ApprovedByUser { get; set; }
}

// System audit record tracking security events and data modifications
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? Role { get; set; }
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? IpAddress { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Global system configuration parameter stored in database
public class PlatformSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
}

