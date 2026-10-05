using HireWise.Api.Models.Enums;

namespace HireWise.Api.DTOs.Interviews;

public class SubmitFeedbackRequest
{
    public int TechnicalSkillsRating { get; set; }
    public int ProblemSolvingRating { get; set; }
    public int CommunicationRating { get; set; }
    public int CulturalFitRating { get; set; }
    public RecommendationType Recommendation { get; set; }
    public string? Notes { get; set; }
    public string? Strengths { get; set; }
    public string? Weaknesses { get; set; }
}

public class UpdateFeedbackRequest
{
    public int? TechnicalSkillsRating { get; set; }
    public int? ProblemSolvingRating { get; set; }
    public int? CommunicationRating { get; set; }
    public int? CulturalFitRating { get; set; }
    public RecommendationType? Recommendation { get; set; }
    public string? Notes { get; set; }
    public string? Strengths { get; set; }
    public string? Weaknesses { get; set; }
}

public class InterviewFeedbackDto
{
    public Guid Id { get; set; }
    public Guid InterviewId { get; set; }
    public Guid InterviewerId { get; set; }
    public string InterviewerName { get; set; } = string.Empty;
    public int TechnicalSkillsRating { get; set; }
    public int ProblemSolvingRating { get; set; }
    public int CommunicationRating { get; set; }
    public int CulturalFitRating { get; set; }
    public decimal OverallRating { get; set; }
    public RecommendationType Recommendation { get; set; }
    public string? Notes { get; set; }
    public string? Strengths { get; set; }
    public string? Weaknesses { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
