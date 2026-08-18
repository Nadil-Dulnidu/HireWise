using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Interviews;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IInterviewService
{
    Task<Result<InterviewDto>> CreateInterviewAsync(CreateInterviewRequest request, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<InterviewDetailDto>> GetInterviewByIdAsync(Guid id, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default);
    Task<PagedResult<InterviewDto>> GetInterviewsAsync(InterviewFilterRequest request, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default);
    Task<PagedResult<InterviewDto>> GetMyInterviewsAsync(Guid userId, string role, PagedRequest request, CancellationToken ct = default);
    Task<Result<InterviewDto>> UpdateInterviewAsync(Guid id, UpdateInterviewRequest request, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<InterviewDto>> CancelInterviewAsync(Guid id, string? reason, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<InterviewDto>> CompleteInterviewAsync(Guid id, Guid interviewerId, CancellationToken ct = default);
}

public class InterviewService : IInterviewService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly ILogger<InterviewService> _logger;

    public InterviewService(
        ApplicationDbContext db,
        IMapper mapper,
        INotificationService notificationService,
        ILogger<InterviewService> logger)
    {
        _db = db;
        _mapper = mapper;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Result<InterviewDto>> CreateInterviewAsync(CreateInterviewRequest request, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        // 1. Check Application
        var application = await _db.Applications
            .Include(a => a.Job)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct);

        if (application == null)
        {
            return Result<InterviewDto>.NotFound("Application not found.");
        }

        if (application.Job.CompanyId != recruiterCompanyId)
        {
            return Result<InterviewDto>.Forbidden("You cannot schedule interviews for another company's job.");
        }

        // Check if an active interview already exists for this application
        var existingInterview = await _db.Interviews
            .FirstOrDefaultAsync(i => i.ApplicationId == request.ApplicationId && i.Status != InterviewStatus.CANCELLED, ct);

        if (existingInterview != null)
        {
            return Result<InterviewDto>.Conflict("An active interview is already scheduled for this application.");
        }

        // 2. Check Interviewer
        var interviewer = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.InterviewerId && u.Role == UserRole.INTERVIEWER && u.CompanyId == recruiterCompanyId, ct);

        if (interviewer == null)
        {
            return Result<InterviewDto>.Failure("Selected interviewer not found or does not belong to your company.");
        }

        // 3. Create Interview
        var interview = new Interview
        {
            ApplicationId = application.Id,
            InterviewerId = interviewer.Id,
            CandidateId = application.CandidateId,
            JobId = application.JobId,
            ScheduledStartTime = request.ScheduledStartTime.ToUniversalTime(),
            ScheduledEndTime = request.ScheduledEndTime.ToUniversalTime(),
            MeetingLink = request.MeetingLink?.Trim(),
            Notes = request.Notes?.Trim(),
            Status = InterviewStatus.SCHEDULED
        };

        _db.Interviews.Add(interview);

        // Update application status
        application.Status = ApplicationStatus.INTERVIEW_SCHEDULED;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Interview {InterviewId} scheduled for Application {ApplicationId} by Company {CompanyId}",
            interview.Id, application.Id, recruiterCompanyId);

        // 4. Send Notifications
        var startTimeStr = interview.ScheduledStartTime.ToString("f");
        await _notificationService.CreateNotificationAsync(
            application.CandidateId,
            "Interview Scheduled",
            $"Your interview for '{application.Job.Title}' has been scheduled for {startTimeStr}.",
            NotificationType.INTERVIEW_SCHEDULED,
            "Interview",
            interview.Id,
            ct);

        await _notificationService.CreateNotificationAsync(
            interviewer.Id,
            "New Interview Assigned",
            $"You have been assigned to interview {application.Candidate.FirstName} {application.Candidate.LastName} for '{application.Job.Title}' on {startTimeStr}.",
            NotificationType.INTERVIEW_SCHEDULED,
            "Interview",
            interview.Id,
            ct);

        var createdDto = await _db.Interviews
            .Include(i => i.Job).ThenInclude(j => j.Company)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .Include(i => i.Feedback)
            .Where(i => i.Id == interview.Id)
            .ProjectTo<InterviewDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return Result<InterviewDto>.Success(createdDto, 201);
    }

    public async Task<Result<InterviewDetailDto>> GetInterviewByIdAsync(Guid id, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default)
    {
        var interview = await _db.Interviews
            .Include(i => i.Job).ThenInclude(j => j.Company)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .Include(i => i.Application)
            .Include(i => i.Feedback)
            .Include(i => i.Questions.OrderBy(q => q.OrderIndex))
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (interview == null)
        {
            return Result<InterviewDetailDto>.NotFound("Interview not found.");
        }

        // Authorization checks
        if (role == "CANDIDATE" && interview.CandidateId != currentUserId)
        {
            return Result<InterviewDetailDto>.Forbidden("You can only view your own interviews.");
        }

        if (role == "INTERVIEWER" && interview.InterviewerId != currentUserId)
        {
            return Result<InterviewDetailDto>.Forbidden("You can only view interviews assigned to you.");
        }

        if (role == "RECRUITER" && companyId.HasValue && interview.Job.CompanyId != companyId.Value)
        {
            return Result<InterviewDetailDto>.Forbidden("You can only view interviews for your company.");
        }

        var detailDto = _mapper.Map<InterviewDetailDto>(interview);

        // Populate extra snapshot details from application
        if (interview.Application != null)
        {
            detailDto.ResumeSnapshotUrl = interview.Application.ResumeSnapshotUrl;
        }

        return Result<InterviewDetailDto>.Success(detailDto);
    }

    public async Task<PagedResult<InterviewDto>> GetInterviewsAsync(InterviewFilterRequest request, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default)
    {
        var query = _db.Interviews
            .Include(i => i.Job).ThenInclude(j => j.Company)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .Include(i => i.Feedback)
            .AsNoTracking();

        // Scoping
        if (role == "RECRUITER" && companyId.HasValue)
        {
            query = query.Where(i => i.Job.CompanyId == companyId.Value);
        }
        else if (role == "INTERVIEWER")
        {
            query = query.Where(i => i.InterviewerId == currentUserId);
        }
        else if (role == "CANDIDATE")
        {
            query = query.Where(i => i.CandidateId == currentUserId);
        }

        // Filters
        if (request.Status.HasValue)
        {
            query = query.Where(i => i.Status == request.Status.Value);
        }

        if (request.JobId.HasValue)
        {
            query = query.Where(i => i.JobId == request.JobId.Value);
        }

        if (request.InterviewerId.HasValue)
        {
            query = query.Where(i => i.InterviewerId == request.InterviewerId.Value);
        }

        if (request.CandidateId.HasValue)
        {
            query = query.Where(i => i.CandidateId == request.CandidateId.Value);
        }

        if (request.DateFrom.HasValue)
        {
            query = query.Where(i => i.ScheduledStartTime >= request.DateFrom.Value.ToUniversalTime());
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(i => i.ScheduledStartTime <= request.DateTo.Value.ToUniversalTime());
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(i =>
                i.Job.Title.ToLower().Contains(search) ||
                i.Candidate.FirstName.ToLower().Contains(search) ||
                i.Candidate.LastName.ToLower().Contains(search) ||
                i.Interviewer.FirstName.ToLower().Contains(search) ||
                i.Interviewer.LastName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(i => i.ScheduledStartTime)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<InterviewDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<InterviewDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<PagedResult<InterviewDto>> GetMyInterviewsAsync(Guid userId, string role, PagedRequest request, CancellationToken ct = default)
    {
        var filter = new InterviewFilterRequest
        {
            Page = request.Page,
            PageSize = request.PageSize,
            Search = request.Search
        };

        return await GetInterviewsAsync(filter, userId, role, null, ct);
    }

    public async Task<Result<InterviewDto>> UpdateInterviewAsync(Guid id, UpdateInterviewRequest request, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var interview = await _db.Interviews
            .Include(i => i.Job)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (interview == null)
        {
            return Result<InterviewDto>.NotFound("Interview not found.");
        }

        if (interview.Job.CompanyId != recruiterCompanyId)
        {
            return Result<InterviewDto>.Forbidden("You cannot modify interviews for other companies.");
        }

        if (interview.Status == InterviewStatus.COMPLETED || interview.Status == InterviewStatus.CANCELLED)
        {
            return Result<InterviewDto>.Failure($"Cannot update an interview that is already {interview.Status}.");
        }

        if (request.ScheduledStartTime.HasValue)
        {
            interview.ScheduledStartTime = request.ScheduledStartTime.Value.ToUniversalTime();
        }

        if (request.ScheduledEndTime.HasValue)
        {
            interview.ScheduledEndTime = request.ScheduledEndTime.Value.ToUniversalTime();
        }

        if (request.MeetingLink != null)
        {
            interview.MeetingLink = request.MeetingLink.Trim();
        }

        if (request.Notes != null)
        {
            interview.Notes = request.Notes.Trim();
        }

        await _db.SaveChangesAsync(ct);

        // Notify candidate & interviewer of schedule update
        var updatedTimeStr = interview.ScheduledStartTime.ToString("f");
        await _notificationService.CreateNotificationAsync(
            interview.CandidateId,
            "Interview Rescheduled",
            $"Your interview for '{interview.Job.Title}' has been updated to {updatedTimeStr}.",
            NotificationType.INTERVIEW_SCHEDULED,
            "Interview",
            interview.Id,
            ct);

        await _notificationService.CreateNotificationAsync(
            interview.InterviewerId,
            "Interview Rescheduled",
            $"The interview with {interview.Candidate.FirstName} {interview.Candidate.LastName} has been updated to {updatedTimeStr}.",
            NotificationType.INTERVIEW_SCHEDULED,
            "Interview",
            interview.Id,
            ct);

        var updatedDto = _mapper.Map<InterviewDto>(interview);
        return Result<InterviewDto>.Success(updatedDto);
    }

    public async Task<Result<InterviewDto>> CancelInterviewAsync(Guid id, string? reason, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var interview = await _db.Interviews
            .Include(i => i.Job)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .Include(i => i.Application)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (interview == null)
        {
            return Result<InterviewDto>.NotFound("Interview not found.");
        }

        if (interview.Job.CompanyId != recruiterCompanyId)
        {
            return Result<InterviewDto>.Forbidden("You cannot cancel interviews for other companies.");
        }

        if (interview.Status == InterviewStatus.COMPLETED)
        {
            return Result<InterviewDto>.Failure("Cannot cancel an interview that has already been completed.");
        }

        interview.Status = InterviewStatus.CANCELLED;
        if (!string.IsNullOrEmpty(reason))
        {
            interview.Notes = string.IsNullOrEmpty(interview.Notes)
                ? $"Cancellation reason: {reason}"
                : $"{interview.Notes}\nCancellation reason: {reason}";
        }

        // Revert application status back to INTERVIEW_APPROVED
        if (interview.Application != null && interview.Application.Status == ApplicationStatus.INTERVIEW_SCHEDULED)
        {
            interview.Application.Status = ApplicationStatus.INTERVIEW_APPROVED;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Interview {InterviewId} cancelled by Recruiter for company {CompanyId}", id, recruiterCompanyId);

        // Notify participants
        var reasonMsg = string.IsNullOrEmpty(reason) ? "" : $" Reason: {reason}";
        await _notificationService.CreateNotificationAsync(
            interview.CandidateId,
            "Interview Cancelled",
            $"Your interview for '{interview.Job.Title}' has been cancelled.{reasonMsg}",
            NotificationType.INTERVIEW_SCHEDULED,
            "Interview",
            interview.Id,
            ct);

        await _notificationService.CreateNotificationAsync(
            interview.InterviewerId,
            "Interview Cancelled",
            $"The interview with {interview.Candidate.FirstName} {interview.Candidate.LastName} has been cancelled.{reasonMsg}",
            NotificationType.INTERVIEW_SCHEDULED,
            "Interview",
            interview.Id,
            ct);

        var dto = _mapper.Map<InterviewDto>(interview);
        return Result<InterviewDto>.Success(dto);
    }

    public async Task<Result<InterviewDto>> CompleteInterviewAsync(Guid id, Guid interviewerId, CancellationToken ct = default)
    {
        var interview = await _db.Interviews
            .Include(i => i.Job)
            .Include(i => i.Candidate)
            .Include(i => i.Application)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (interview == null)
        {
            return Result<InterviewDto>.NotFound("Interview not found.");
        }

        if (interview.InterviewerId != interviewerId)
        {
            return Result<InterviewDto>.Forbidden("Only the assigned interviewer can mark this interview as completed.");
        }

        if (interview.Status == InterviewStatus.CANCELLED)
        {
            return Result<InterviewDto>.Failure("Cannot complete a cancelled interview.");
        }

        interview.Status = InterviewStatus.COMPLETED;

        // Update application status to INTERVIEW_COMPLETED
        if (interview.Application != null)
        {
            interview.Application.Status = ApplicationStatus.INTERVIEW_COMPLETED;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Interview {InterviewId} marked COMPLETED by Interviewer {InterviewerId}", id, interviewerId);

        // Notify candidate
        await _notificationService.CreateNotificationAsync(
            interview.CandidateId,
            "Interview Completed",
            $"Your interview for '{interview.Job.Title}' has concluded. Feedback is being prepared.",
            NotificationType.APPLICATION_UPDATE,
            "Interview",
            interview.Id,
            ct);

        // Notify recruiter
        if (interview.Job.CreatedByUserId != Guid.Empty)
        {
            await _notificationService.CreateNotificationAsync(
                interview.Job.CreatedByUserId,
                "Interview Completed",
                $"Interviewer has completed the round for {interview.Candidate.FirstName} {interview.Candidate.LastName} ({interview.Job.Title}).",
                NotificationType.APPLICATION_UPDATE,
                "Interview",
                interview.Id,
                ct);
        }

        var dto = _mapper.Map<InterviewDto>(interview);
        return Result<InterviewDto>.Success(dto);
    }
}
