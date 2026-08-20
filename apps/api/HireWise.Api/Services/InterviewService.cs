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
    private readonly IGoogleCalendarService _calendarService;
    private readonly IEmailService _emailService;
    private readonly ILogger<InterviewService> _logger;

    public InterviewService(
        ApplicationDbContext db,
        IMapper mapper,
        INotificationService notificationService,
        IGoogleCalendarService calendarService,
        IEmailService emailService,
        ILogger<InterviewService> logger)
    {
        _db = db;
        _mapper = mapper;
        _notificationService = notificationService;
        _calendarService = calendarService;
        _emailService = emailService;
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

        // Check if application is in a non-schedulable state
        if (application.Status == ApplicationStatus.INTERVIEW_SCHEDULED ||
            application.Status == ApplicationStatus.INTERVIEW_COMPLETED ||
            application.Status == ApplicationStatus.SELECTED ||
            application.Status == ApplicationStatus.REJECTED)
        {
            return Result<InterviewDto>.Conflict($"This applicant is currently in '{application.Status.ToString().Replace('_', ' ')}' status and is no longer eligible for interview scheduling.");
        }

        // Check if an interview already exists for this application (including soft-deleted or cancelled)
        var existingInterview = await _db.Interviews.IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.ApplicationId == request.ApplicationId, ct);

        if (existingInterview != null && !existingInterview.IsDeleted && existingInterview.Status != InterviewStatus.CANCELLED)
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

        var startTimeUtc = request.ScheduledStartTime.ToUniversalTime();
        var endTimeUtc = request.ScheduledEndTime.ToUniversalTime();

        // 2a. Validate Interviewer Availability & Conflicts
        var availabilityError = await ValidateInterviewerAvailabilityAsync(
            interviewer.Id, startTimeUtc, endTimeUtc, existingInterview?.Id, ct);
        if (!string.IsNullOrEmpty(availabilityError))
        {
            return Result<InterviewDto>.Failure(availabilityError);
        }

        // 2b. Validate Candidate Conflicts
        var candidateError = await ValidateCandidateAvailabilityAsync(
            application.CandidateId, startTimeUtc, endTimeUtc, existingInterview?.Id, ct);
        if (!string.IsNullOrEmpty(candidateError))
        {
            return Result<InterviewDto>.Failure(candidateError);
        }

        // 3. Create or Reactivate Interview
        Interview interview;
        if (existingInterview != null)
        {
            interview = existingInterview;
            interview.InterviewerId = interviewer.Id;
            interview.CandidateId = application.CandidateId;
            interview.JobId = application.JobId;
            interview.ScheduledStartTime = startTimeUtc;
            interview.ScheduledEndTime = endTimeUtc;
            interview.MeetingLink = request.MeetingLink?.Trim();
            interview.Notes = request.Notes?.Trim();
            interview.Status = InterviewStatus.SCHEDULED;
            interview.IsDeleted = false;
            interview.DeletedAt = null;
            interview.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            interview = new Interview
            {
                ApplicationId = application.Id,
                InterviewerId = interviewer.Id,
                CandidateId = application.CandidateId,
                JobId = application.JobId,
                ScheduledStartTime = startTimeUtc,
                ScheduledEndTime = endTimeUtc,
                MeetingLink = request.MeetingLink?.Trim(),
                Notes = request.Notes?.Trim(),
                Status = InterviewStatus.SCHEDULED
            };
            _db.Interviews.Add(interview);
        }

        // Update application status
        application.Status = ApplicationStatus.INTERVIEW_SCHEDULED;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error while saving interview for Application {ApplicationId}", application.Id);
            return Result<InterviewDto>.Conflict("An interview record already exists for this application or a conflict occurred.");
        }

        _logger.LogInformation("Interview {InterviewId} scheduled for Application {ApplicationId} by Company {CompanyId}",
            interview.Id, application.Id, recruiterCompanyId);

        // 4. Google Calendar Integration
        try
        {
            var calendarEventId = await _calendarService.CreateInterviewEventAsync(
                interview, application.Candidate, interviewer, application.Job, ct);
            if (!string.IsNullOrEmpty(calendarEventId))
            {
                interview.GoogleCalendarEventId = calendarEventId;
                await _db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create Google Calendar event for Interview {InterviewId}", interview.Id);
        }

        // 5. Send Notifications
        try
        {
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
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to dispatch SignalR notifications for Interview {InterviewId}", interview.Id);
        }

        // 6. Send Emails
        var candidateName = $"{application.Candidate.FirstName} {application.Candidate.LastName}";
        var interviewerName = $"{interviewer.FirstName} {interviewer.LastName}";

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendInterviewScheduledEmailAsync(
                    application.Candidate.Email, candidateName, application.Job.Title,
                    interview.ScheduledStartTime, interview.ScheduledEndTime, interview.MeetingLink, CancellationToken.None);

                await _emailService.SendInterviewScheduledEmailAsync(
                    interviewer.Email, interviewerName, application.Job.Title,
                    interview.ScheduledStartTime, interview.ScheduledEndTime, interview.MeetingLink, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send interview scheduled emails for Interview {InterviewId}", interview.Id);
            }
        });

        var created = await _db.Interviews
            .Include(i => i.Job).ThenInclude(j => j.Company)
            .Include(i => i.Candidate)
            .Include(i => i.Interviewer)
            .Include(i => i.Feedback)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == interview.Id, ct);

        var createdDto = _mapper.Map<InterviewDto>(created ?? interview);
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

        var entities = await query
            .OrderByDescending(i => i.ScheduledStartTime)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var items = _mapper.Map<List<InterviewDto>>(entities);
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

        var newStartTime = request.ScheduledStartTime.HasValue
            ? request.ScheduledStartTime.Value.ToUniversalTime()
            : interview.ScheduledStartTime;
        var newEndTime = request.ScheduledEndTime.HasValue
            ? request.ScheduledEndTime.Value.ToUniversalTime()
            : interview.ScheduledEndTime;

        if (request.ScheduledStartTime.HasValue || request.ScheduledEndTime.HasValue)
        {
            var availErr = await ValidateInterviewerAvailabilityAsync(
                interview.InterviewerId, newStartTime, newEndTime, interview.Id, ct);
            if (!string.IsNullOrEmpty(availErr))
            {
                return Result<InterviewDto>.Failure(availErr);
            }

            var candErr = await ValidateCandidateAvailabilityAsync(
                interview.CandidateId, newStartTime, newEndTime, interview.Id, ct);
            if (!string.IsNullOrEmpty(candErr))
            {
                return Result<InterviewDto>.Failure(candErr);
            }

            interview.ScheduledStartTime = newStartTime;
            interview.ScheduledEndTime = newEndTime;
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

        // Google Calendar: update event
        if (!string.IsNullOrEmpty(interview.GoogleCalendarEventId))
        {
            await _calendarService.UpdateInterviewEventAsync(interview.GoogleCalendarEventId, interview, ct);
        }

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

        // Send reschedule emails
        var candidateName = $"{interview.Candidate.FirstName} {interview.Candidate.LastName}";
        var interviewerName = $"{interview.Interviewer.FirstName} {interview.Interviewer.LastName}";

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendInterviewRescheduledEmailAsync(
                    interview.Candidate.Email, candidateName, interview.Job.Title,
                    interview.ScheduledStartTime, CancellationToken.None);

                await _emailService.SendInterviewRescheduledEmailAsync(
                    interview.Interviewer.Email, interviewerName, interview.Job.Title,
                    interview.ScheduledStartTime, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send interview rescheduled emails for Interview {InterviewId}", interview.Id);
            }
        });

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

        // Google Calendar: delete event
        if (!string.IsNullOrEmpty(interview.GoogleCalendarEventId))
        {
            await _calendarService.DeleteInterviewEventAsync(interview.GoogleCalendarEventId, ct);
            interview.GoogleCalendarEventId = null;
            await _db.SaveChangesAsync(ct);
        }

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

        // Send cancellation emails
        var candidateName = $"{interview.Candidate.FirstName} {interview.Candidate.LastName}";
        var interviewerName = $"{interview.Interviewer.FirstName} {interview.Interviewer.LastName}";

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendInterviewCancelledEmailAsync(
                    interview.Candidate.Email, candidateName, interview.Job.Title, reason, CancellationToken.None);

                await _emailService.SendInterviewCancelledEmailAsync(
                    interview.Interviewer.Email, interviewerName, interview.Job.Title, reason, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send interview cancelled emails for Interview {InterviewId}", interview.Id);
            }
        });

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

    private async Task<string?> ValidateInterviewerAvailabilityAsync(
        Guid interviewerId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        Guid? excludeInterviewId,
        CancellationToken ct)
    {
        if (endTimeUtc <= startTimeUtc)
        {
            return "Interview end time must be after the start time.";
        }

        // 1. Check for overlapping interviews for the same interviewer
        var interviewerConflict = await _db.Interviews
            .AnyAsync(i => i.InterviewerId == interviewerId
                && (excludeInterviewId == null || i.Id != excludeInterviewId.Value)
                && i.Status != InterviewStatus.CANCELLED
                && i.ScheduledStartTime < endTimeUtc
                && i.ScheduledEndTime > startTimeUtc, ct);

        if (interviewerConflict)
        {
            return "The interviewer already has another interview session scheduled during this time window.";
        }

        // 2. Check interviewer's defined availability slots
        var slots = await _db.AvailabilitySlots
            .Where(s => s.UserId == interviewerId)
            .ToListAsync(ct);

        // If the interviewer has explicitly set availability slots, enforce them!
        if (slots.Count > 0)
        {
            var reqDayOfWeek = startTimeUtc.DayOfWeek;
            var reqDate = DateOnly.FromDateTime(startTimeUtc);
            var reqStartTime = startTimeUtc.TimeOfDay;
            var reqEndTime = endTimeUtc.TimeOfDay;

            if (startTimeUtc.Date != endTimeUtc.Date)
            {
                return "Interviews cannot span across multiple calendar days in UTC.";
            }

            var isWithinSlot = slots.Any(s =>
            {
                if (s.SpecificDate.HasValue)
                {
                    return s.SpecificDate.Value == reqDate && s.StartTime <= reqStartTime && s.EndTime >= reqEndTime;
                }

                if (s.IsRecurring)
                {
                    return s.DayOfWeek == reqDayOfWeek && s.StartTime <= reqStartTime && s.EndTime >= reqEndTime;
                }

                return false;
            });

            if (!isWithinSlot)
            {
                return $"The requested interview time ({startTimeUtc:ddd, MMM d HH:mm} – {endTimeUtc:HH:mm} UTC) is outside the interviewer's configured availability hours.";
            }
        }

        return null;
    }

    private async Task<string?> ValidateCandidateAvailabilityAsync(
        Guid candidateId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        Guid? excludeInterviewId,
        CancellationToken ct)
    {
        var candidateConflict = await _db.Interviews
            .AnyAsync(i => i.CandidateId == candidateId
                && (excludeInterviewId == null || i.Id != excludeInterviewId.Value)
                && i.Status != InterviewStatus.CANCELLED
                && i.ScheduledStartTime < endTimeUtc
                && i.ScheduledEndTime > startTimeUtc, ct);

        if (candidateConflict)
        {
            return "The candidate already has another interview scheduled during this time window.";
        }

        return null;
    }
}
