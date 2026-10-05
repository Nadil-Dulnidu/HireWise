using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Interviews;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services.Integrations;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IInterviewFeedbackService
{
    Task<Result<InterviewFeedbackDto>> SubmitFeedbackAsync(Guid interviewId, Guid interviewerId, SubmitFeedbackRequest request, CancellationToken ct = default);
    Task<Result<InterviewFeedbackDto>> GetFeedbackByInterviewIdAsync(Guid interviewId, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default);
    Task<Result<InterviewFeedbackDto>> UpdateFeedbackAsync(Guid feedbackId, Guid interviewerId, UpdateFeedbackRequest request, CancellationToken ct = default);
}

public class InterviewFeedbackService : IInterviewFeedbackService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<InterviewFeedbackService> _logger;

    public InterviewFeedbackService(
        ApplicationDbContext db,
        IMapper mapper,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<InterviewFeedbackService> logger)
    {
        _db = db;
        _mapper = mapper;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<InterviewFeedbackDto>> SubmitFeedbackAsync(Guid interviewId, Guid interviewerId, SubmitFeedbackRequest request, CancellationToken ct = default)
    {
        var interview = await _db.Interviews
            .Include(i => i.Job)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .Include(i => i.Application)
            .Include(i => i.Feedback)
            .FirstOrDefaultAsync(i => i.Id == interviewId, ct);

        if (interview == null)
        {
            return Result<InterviewFeedbackDto>.NotFound("Interview not found.");
        }

        if (interview.InterviewerId != interviewerId)
        {
            return Result<InterviewFeedbackDto>.Forbidden("Only the assigned interviewer can submit feedback for this interview.");
        }

        if (interview.Status == InterviewStatus.CANCELLED)
        {
            return Result<InterviewFeedbackDto>.Failure("Cannot submit feedback for a cancelled interview.");
        }

        if (interview.Feedback != null)
        {
            return Result<InterviewFeedbackDto>.Conflict("Feedback has already been submitted for this interview. Use update if revisions are needed.");
        }

        // Calculate average overall rating
        var ratings = new[]
        {
            request.TechnicalSkillsRating,
            request.ProblemSolvingRating,
            request.CommunicationRating,
            request.CulturalFitRating
        };
        var overallRating = Math.Round((decimal)ratings.Average(), 2);

        var feedback = new InterviewFeedback
        {
            InterviewId = interview.Id,
            InterviewerId = interviewerId,
            TechnicalSkillsRating = request.TechnicalSkillsRating,
            ProblemSolvingRating = request.ProblemSolvingRating,
            CommunicationRating = request.CommunicationRating,
            CulturalFitRating = request.CulturalFitRating,
            OverallRating = overallRating,
            Recommendation = request.Recommendation,
            Notes = request.Notes?.Trim(),
            Strengths = request.Strengths?.Trim(),
            Weaknesses = request.Weaknesses?.Trim(),
            SubmittedAt = DateTime.UtcNow
        };

        _db.InterviewFeedbacks.Add(feedback);

        // Mark interview as COMPLETED
        interview.Status = InterviewStatus.COMPLETED;

        // Progress application status to EVALUATION_PENDING
        if (interview.Application != null)
        {
            interview.Application.Status = ApplicationStatus.EVALUATION_PENDING;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Feedback submitted for Interview {InterviewId} by Interviewer {InterviewerId}. Recommendation: {Rec}, Overall: {Rating}",
            interview.Id, interviewerId, feedback.Recommendation, feedback.OverallRating);

        // Send notification to Recruiter
        if (interview.Job.CreatedByUserId != Guid.Empty)
        {
            var recLabel = feedback.Recommendation switch
            {
                RecommendationType.STRONG_HIRE => "Strongly Recommended",
                RecommendationType.HIRE => "Recommended",
                RecommendationType.NO_HIRE => "Not Recommended",
                RecommendationType.STRONG_NO_HIRE => "Not Recommended",
                _ => "Reviewed"
            };

            await _notificationService.CreateNotificationAsync(
                interview.Job.CreatedByUserId,
                "Interview Feedback Submitted",
                $"{interview.Interviewer.FirstName} submitted feedback for {interview.Candidate.FirstName} {interview.Candidate.LastName} ({interview.Job.Title}): {recLabel} ({overallRating}/5 rating).",
                NotificationType.FEEDBACK_SUBMITTED,
                "Interview",
                interview.Id,
                ct);
        }

        // Send notification to Candidate
        await _notificationService.CreateNotificationAsync(
            interview.CandidateId,
            "Interview Feedback Received",
            $"Your interview for '{interview.Job.Title}' has concluded and the hiring team is reviewing feedback.",
            NotificationType.APPLICATION_UPDATE,
            "Application",
            interview.ApplicationId,
            ct);

        // Send feedback submitted email to recruiter
        if (interview.Job.CreatedByUserId != Guid.Empty)
        {
            var recruiter = await _db.Users.FirstOrDefaultAsync(u => u.Id == interview.Job.CreatedByUserId, ct);
            if (recruiter != null)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendInterviewFeedbackSubmittedEmailAsync(
                            recruiter.Email,
                            $"{recruiter.FirstName} {recruiter.LastName}",
                            $"{interview.Interviewer.FirstName} {interview.Interviewer.LastName}",
                            $"{interview.Candidate.FirstName} {interview.Candidate.LastName}",
                            interview.Job.Title,
                            CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send feedback submitted email for Interview {InterviewId}", interview.Id);
                    }
                });
            }
        }

        var createdDto = await _db.InterviewFeedbacks
            .Include(f => f.Interviewer)
            .Where(f => f.Id == feedback.Id)
            .ProjectTo<InterviewFeedbackDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return Result<InterviewFeedbackDto>.Success(createdDto, 201);
    }

    public async Task<Result<InterviewFeedbackDto>> GetFeedbackByInterviewIdAsync(Guid interviewId, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default)
    {
        var feedback = await _db.InterviewFeedbacks
            .Include(f => f.Interview).ThenInclude(i => i.Job)
            .Include(f => f.Interviewer)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.InterviewId == interviewId, ct);

        if (feedback == null)
        {
            return Result<InterviewFeedbackDto>.NotFound("No feedback found for this interview.");
        }

        // Authorization checks
        if (role == "CANDIDATE")
        {
            return Result<InterviewFeedbackDto>.Forbidden("Candidates cannot view detailed interviewer feedback.");
        }

        if (role == "INTERVIEWER" && feedback.InterviewerId != currentUserId)
        {
            return Result<InterviewFeedbackDto>.Forbidden("You can only view feedback you submitted.");
        }

        if (role == "RECRUITER" && companyId.HasValue && feedback.Interview.Job.CompanyId != companyId.Value)
        {
            return Result<InterviewFeedbackDto>.Forbidden("You cannot view feedback for another company.");
        }

        var dto = _mapper.Map<InterviewFeedbackDto>(feedback);
        return Result<InterviewFeedbackDto>.Success(dto);
    }

    public async Task<Result<InterviewFeedbackDto>> UpdateFeedbackAsync(Guid feedbackId, Guid interviewerId, UpdateFeedbackRequest request, CancellationToken ct = default)
    {
        var feedback = await _db.InterviewFeedbacks
            .Include(f => f.Interviewer)
            .FirstOrDefaultAsync(f => f.Id == feedbackId, ct);

        if (feedback == null)
        {
            return Result<InterviewFeedbackDto>.NotFound("Feedback not found.");
        }

        if (feedback.InterviewerId != interviewerId)
        {
            return Result<InterviewFeedbackDto>.Forbidden("Only the original evaluator can update this feedback.");
        }

        if (request.TechnicalSkillsRating.HasValue) feedback.TechnicalSkillsRating = request.TechnicalSkillsRating.Value;
        if (request.ProblemSolvingRating.HasValue) feedback.ProblemSolvingRating = request.ProblemSolvingRating.Value;
        if (request.CommunicationRating.HasValue) feedback.CommunicationRating = request.CommunicationRating.Value;
        if (request.CulturalFitRating.HasValue) feedback.CulturalFitRating = request.CulturalFitRating.Value;

        // Recalculate overall rating
        var ratings = new[]
        {
            feedback.TechnicalSkillsRating,
            feedback.ProblemSolvingRating,
            feedback.CommunicationRating,
            feedback.CulturalFitRating
        };
        feedback.OverallRating = Math.Round((decimal)ratings.Average(), 2);

        if (request.Recommendation.HasValue) feedback.Recommendation = request.Recommendation.Value;
        if (request.Notes != null) feedback.Notes = request.Notes.Trim();
        if (request.Strengths != null) feedback.Strengths = request.Strengths.Trim();
        if (request.Weaknesses != null) feedback.Weaknesses = request.Weaknesses.Trim();

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Feedback {FeedbackId} updated by Interviewer {InterviewerId}", feedbackId, interviewerId);

        var dto = _mapper.Map<InterviewFeedbackDto>(feedback);
        return Result<InterviewFeedbackDto>.Success(dto);
    }
}
