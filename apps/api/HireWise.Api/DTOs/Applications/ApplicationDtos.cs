using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.DTOs.Applications;

public class ApplyJobRequest
{
    public string? CoverLetter { get; set; }
}

public class ChangeApplicationStatusRequest
{
    public ApplicationStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class ApplicationDto
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string JobLocation { get; set; } = string.Empty;
    public EmploymentType JobEmploymentType { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyLogoUrl { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; }
    public string? ResumeSnapshotUrl { get; set; }
    public string? CoverLetter { get; set; }
    public Guid? AiWorkflowId { get; set; }
    public DateTime AppliedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApplicationDetailDto : ApplicationDto
{
    public string JobDescription { get; set; } = string.Empty;
    public string JobRequirements { get; set; } = string.Empty;
    public decimal? JobSalaryMin { get; set; }
    public decimal? JobSalaryMax { get; set; }
    public string JobSalaryCurrency { get; set; } = "USD";
    public string? CandidatePhone { get; set; }
    public string? CandidateProfileImageUrl { get; set; }
    public bool HasInterviewScheduled { get; set; }
    public Guid? InterviewId { get; set; }
}

public class ApplicationFilterRequest : PagedRequest
{
    public Guid? JobId { get; set; }
    public Guid? CandidateId { get; set; }
    public Guid? CompanyId { get; set; }
    public ApplicationStatus? Status { get; set; }
}

public class SchedulingReadinessDto
{
    public bool HasInterviewers { get; set; }
    public int InterviewerCount { get; set; }
    public bool HasInterviewerSlots { get; set; }
    public int InterviewerSlotCount { get; set; }
    public bool HasCandidateSlots { get; set; }
    public int CandidateSlotCount { get; set; }
    public bool CanApprove { get; set; }
    public string? Message { get; set; }
}

