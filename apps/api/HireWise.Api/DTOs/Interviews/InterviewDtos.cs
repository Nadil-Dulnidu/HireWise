using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.DTOs.Interviews;

public class CreateInterviewRequest
{
    public Guid ApplicationId { get; set; }
    public Guid InterviewerId { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public string? MeetingLink { get; set; }
    public string? Notes { get; set; }
}

public class UpdateInterviewRequest
{
    public DateTime? ScheduledStartTime { get; set; }
    public DateTime? ScheduledEndTime { get; set; }
    public string? MeetingLink { get; set; }
    public string? Notes { get; set; }
}

public class InterviewFilterRequest : PagedRequest
{
    public InterviewStatus? Status { get; set; }
    public Guid? InterviewerId { get; set; }
    public Guid? CandidateId { get; set; }
    public Guid? JobId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
}

public class InterviewDto
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public string? CandidateProfileImageUrl { get; set; }
    public Guid InterviewerId { get; set; }
    public string InterviewerName { get; set; } = string.Empty;
    public string InterviewerEmail { get; set; } = string.Empty;
    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public string? MeetingLink { get; set; }
    public InterviewStatus Status { get; set; }
    public string? Notes { get; set; }
    public bool HasFeedback { get; set; }
    public decimal? OverallRating { get; set; }
    public RecommendationType? Recommendation { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class InterviewDetailDto : InterviewDto
{
    public string? JobDescription { get; set; }
    public string? CandidatePhone { get; set; }
    public string? ResumeSnapshotUrl { get; set; }
    public InterviewFeedbackDto? Feedback { get; set; }
    public List<InterviewQuestionDto> Questions { get; set; } = new();
}

public class InterviewQuestionDto
{
    public Guid Id { get; set; }
    public QuestionCategory Category { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? ExpectedAnswer { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public int OrderIndex { get; set; }
}
