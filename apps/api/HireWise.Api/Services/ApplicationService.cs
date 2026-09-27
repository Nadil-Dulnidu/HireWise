using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Applications;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services.Ai;
using HireWise.Api.Services.Integrations;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IApplicationService
{
    Task<Result<ApplicationDto>> ApplyToJobAsync(Guid jobId, Guid candidateId, ApplyJobRequest request, CancellationToken ct = default);
    Task<PagedResult<ApplicationDto>> GetCandidateApplicationsAsync(Guid candidateId, PagedRequest request, CancellationToken ct = default);
    Task<Result<ApplicationDetailDto>> GetApplicationByIdAsync(Guid id, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default);
    Task<PagedResult<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, ApplicationFilterRequest request, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<PagedResult<ApplicationDto>> GetCompanyApplicationsAsync(ApplicationFilterRequest request, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<ApplicationDto>> UpdateApplicationStatusAsync(Guid id, ApplicationStatus newStatus, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<ApplicationDto>> ApproveForInterviewAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<ApplicationDto>> RejectApplicationAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default);
    Task<Result<SchedulingReadinessDto>> GetSchedulingReadinessAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default);
}

public class ApplicationService : IApplicationService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly IAiServiceClient _aiServiceClient;
    private readonly IEmailService _emailService;
    private readonly ILogger<ApplicationService> _logger;

    public ApplicationService(
        ApplicationDbContext db,
        IMapper mapper,
        INotificationService notificationService,
        IAiServiceClient aiServiceClient,
        IEmailService emailService,
        ILogger<ApplicationService> logger)
    {
        _db = db;
        _mapper = mapper;
        _notificationService = notificationService;
        _aiServiceClient = aiServiceClient;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<ApplicationDto>> ApplyToJobAsync(Guid jobId, Guid candidateId, ApplyJobRequest request, CancellationToken ct = default)
    {
        // 1. Verify Job exists and is OPEN
        var job = await _db.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);

        if (job == null)
        {
            return Result<ApplicationDto>.NotFound("Job not found.");
        }

        if (job.Status != JobStatus.OPEN)
        {
            return Result<ApplicationDto>.Failure("This job is currently not accepting applications.");
        }

        if (job.ApplicationDeadline.HasValue && job.ApplicationDeadline.Value < DateTime.UtcNow)
        {
            return Result<ApplicationDto>.Failure("The application deadline for this position has passed.");
        }

        // 2. Verify Candidate hasn't already applied
        var alreadyApplied = await _db.Applications.AnyAsync(a => a.JobId == jobId && a.CandidateId == candidateId, ct);
        if (alreadyApplied)
        {
            return Result<ApplicationDto>.Conflict("You have already submitted an application for this job posting.");
        }

        // 3. Verify Candidate has an active resume
        var activeResume = await _db.Resumes
            .Where(r => r.CandidateId == candidateId && r.IsActive)
            .OrderByDescending(r => r.UploadedAt)
            .FirstOrDefaultAsync(ct);

        if (activeResume == null)
        {
            return Result<ApplicationDto>.Failure("Please upload your resume before submitting your application.");
        }

        var candidate = await _db.Users.FirstOrDefaultAsync(u => u.Id == candidateId, ct);
        if (candidate == null)
        {
            return Result<ApplicationDto>.NotFound("Candidate profile not found.");
        }

        // 4. Create Application record
        var application = new Application
        {
            JobId = jobId,
            CandidateId = candidateId,
            Status = ApplicationStatus.APPLIED,
            ResumeSnapshotUrl = activeResume.FileUrl,
            CoverLetter = request.CoverLetter?.Trim(),
            AppliedAt = DateTime.UtcNow
        };

        _db.Applications.Add(application);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Candidate {CandidateId} successfully applied to Job {JobId}. ApplicationId: {ApplicationId}",
            candidateId, jobId, application.Id);

        // 5. Send In-App Notifications
        await _notificationService.CreateNotificationAsync(
            candidateId,
            "Application Received",
            $"Your application for '{job.Title}' at {job.Company.Name} has been submitted and is queued for AI review.",
            NotificationType.APPLICATION_UPDATE,
            "Application",
            application.Id,
            ct);

        if (job.CreatedByUserId != Guid.Empty)
        {
            await _notificationService.CreateNotificationAsync(
                job.CreatedByUserId,
                "New Candidate Application",
                $"{candidate.FirstName} {candidate.LastName} applied for '{job.Title}'.",
                NotificationType.APPLICATION_UPDATE,
                "Application",
                application.Id,
                ct);
        }

        // 5b. Send Application Received Email
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendApplicationReceivedEmailAsync(
                    candidate.Email,
                    $"{candidate.FirstName} {candidate.LastName}",
                    job.Title,
                    job.Company.Name,
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send application received email to {Email}", candidate.Email);
            }
        });

        // 6. Transition to AI_REVIEW and trigger AI evaluation in background
        application.Status = ApplicationStatus.AI_REVIEW;
        await _db.SaveChangesAsync(ct);

        // Fetch availability slots to initialize AI scheduling context
        var firstInterviewer = await _db.Users
            .Where(u => u.CompanyId == job.CompanyId && u.Role == UserRole.INTERVIEWER && !u.IsDeleted)
            .FirstOrDefaultAsync(ct);

        var candidateSlots = await _db.AvailabilitySlots
            .Where(s => s.UserId == application.CandidateId && !s.IsDeleted)
            .Select(s => new
            {
                id = s.Id.ToString(),
                user_id = s.UserId.ToString(),
                role = "CANDIDATE",
                start_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.StartTime),
                end_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.EndTime),
                timezone = s.Timezone
            })
            .ToListAsync(ct);

        var interviewerSlots = firstInterviewer != null
            ? await _db.AvailabilitySlots
                .Where(s => s.UserId == firstInterviewer.Id && !s.IsDeleted)
                .Select(s => new
                {
                    id = s.Id.ToString(),
                    user_id = s.UserId.ToString(),
                    role = "INTERVIEWER",
                    start_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.StartTime),
                    end_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.EndTime),
                    timezone = s.Timezone
                })
                .ToListAsync(ct)
            : new();

        var candIdVal = application.CandidateId.ToString();
        var invIdVal = firstInterviewer?.Id.ToString();

        _ = Task.Run(async () =>
        {
            try
            {
                await _aiServiceClient.TriggerApplicationEvaluationAsync(
                    application.Id,
                    job.Title,
                    job.Description,
                    job.Requirements,
                    activeResume.FileUrl,
                    candidateId: candIdVal,
                    interviewerId: invIdVal,
                    candidateSlots: candidateSlots,
                    interviewerSlots: interviewerSlots,
                    ct: CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background AI evaluation trigger failed for application {ApplicationId}", application.Id);
            }
        });

        var createdDto = await _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .Where(a => a.Id == application.Id)
            .ProjectTo<ApplicationDto>(_mapper.ConfigurationProvider)
            .FirstAsync(ct);

        return Result<ApplicationDto>.Success(createdDto, 201);
    }

    public async Task<PagedResult<ApplicationDto>> GetCandidateApplicationsAsync(Guid candidateId, PagedRequest request, CancellationToken ct = default)
    {
        var query = _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .Where(a => a.CandidateId == candidateId)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(a => a.Job.Title.ToLower().Contains(search) || a.Job.Company.Name.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.AppliedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<ApplicationDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<ApplicationDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Result<ApplicationDetailDto>> GetApplicationByIdAsync(Guid id, Guid currentUserId, string role, Guid? companyId, CancellationToken ct = default)
    {
        var query = _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .Include(a => a.Interview)
            .AsNoTracking();

        var application = await query.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (application == null)
        {
            return Result<ApplicationDetailDto>.NotFound("Application not found.");
        }

        // Authorization check:
        // Candidate can only view their own application
        if (role == "CANDIDATE" && application.CandidateId != currentUserId)
        {
            return Result<ApplicationDetailDto>.Forbidden("You do not have access to view this application.");
        }

        // Recruiter can only view applications for their company's jobs
        if (role == "RECRUITER" && companyId.HasValue && application.Job.CompanyId != companyId.Value)
        {
            return Result<ApplicationDetailDto>.Forbidden("You do not have permission to view applications for another company.");
        }

        var detailDto = _mapper.Map<ApplicationDetailDto>(application);
        return Result<ApplicationDetailDto>.Success(detailDto);
    }

    public async Task<PagedResult<ApplicationDto>> GetJobApplicationsAsync(Guid jobId, ApplicationFilterRequest request, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.CompanyId == recruiterCompanyId, ct);
        if (job == null)
        {
            return new PagedResult<ApplicationDto>(new List<ApplicationDto>(), 0, request.Page, request.PageSize);
        }

        var query = _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .Where(a => a.JobId == jobId)
            .AsNoTracking();

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Candidate.FirstName.ToLower().Contains(search) ||
                a.Candidate.LastName.ToLower().Contains(search) ||
                a.Candidate.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.AppliedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<ApplicationDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<ApplicationDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<PagedResult<ApplicationDto>> GetCompanyApplicationsAsync(ApplicationFilterRequest request, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var query = _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .Where(a => a.Job.CompanyId == recruiterCompanyId)
            .AsNoTracking();

        if (request.JobId.HasValue)
        {
            query = query.Where(a => a.JobId == request.JobId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Job.Title.ToLower().Contains(search) ||
                a.Candidate.FirstName.ToLower().Contains(search) ||
                a.Candidate.LastName.ToLower().Contains(search) ||
                a.Candidate.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.AppliedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<ApplicationDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<ApplicationDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Result<ApplicationDto>> UpdateApplicationStatusAsync(Guid id, ApplicationStatus newStatus, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var application = await _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (application == null)
        {
            return Result<ApplicationDto>.NotFound("Application not found.");
        }

        if (application.Job.CompanyId != recruiterCompanyId)
        {
            return Result<ApplicationDto>.Forbidden("You cannot manage applications for other companies.");
        }

        application.Status = newStatus;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Recruiter updated Application {ApplicationId} status to {Status}", id, newStatus);

        // Notify candidate
        await _notificationService.CreateNotificationAsync(
            application.CandidateId,
            "Application Status Updated",
            $"Your application for '{application.Job.Title}' status changed to: {newStatus.ToString().Replace('_', ' ')}.",
            NotificationType.APPLICATION_UPDATE,
            "Application",
            application.Id,
            ct);

        // Send status update email
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendApplicationStatusUpdateEmailAsync(
                    application.Candidate.Email,
                    $"{application.Candidate.FirstName} {application.Candidate.LastName}",
                    application.Job.Title,
                    newStatus.ToString(),
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send application status update email for Application {ApplicationId}", id);
            }
        });

        return Result<ApplicationDto>.Success(_mapper.Map<ApplicationDto>(application));
    }

    public async Task<Result<ApplicationDto>> ApproveForInterviewAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var application = await _db.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (application == null)
        {
            return Result<ApplicationDto>.NotFound("Application not found.");
        }

        if (application.Status == ApplicationStatus.INTERVIEW_SCHEDULED ||
            application.Status == ApplicationStatus.INTERVIEW_COMPLETED)
        {
            return Result<ApplicationDto>.Conflict("Cannot approve: an interview is already scheduled or completed for this applicant.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Check if organization has interviewers
        var companyInterviewers = await _db.Users
            .Where(u => u.CompanyId == recruiterCompanyId && u.Role == UserRole.INTERVIEWER && !u.IsDeleted)
            .ToListAsync(ct);

        if (companyInterviewers.Count == 0)
        {
            return Result<ApplicationDto>.Failure(
                "Your organization does not have any interviewers assigned. Please add interviewers in Team & Interviewers before approving candidates for interviews.",
                400);
        }

        // 2. Check if organization interviewers have availability slots
        var interviewerIds = companyInterviewers.Select(u => u.Id).ToList();
        var hasInterviewerSlots = await _db.AvailabilitySlots
            .AnyAsync(s => interviewerIds.Contains(s.UserId) && !s.IsDeleted && (s.SpecificDate == null || s.SpecificDate >= today), ct);

        if (!hasInterviewerSlots)
        {
            return Result<ApplicationDto>.Failure(
                "Your organization's interviewers have not added any availability slots yet. Please ensure your interviewers publish their available time slots before approving candidates.",
                400);
        }

        // 3. Check if candidate has availability slots
        var hasCandidateSlots = await _db.AvailabilitySlots
            .AnyAsync(s => s.UserId == application.CandidateId && !s.IsDeleted && (s.SpecificDate == null || s.SpecificDate >= today), ct);

        if (!hasCandidateSlots)
        {
            var candidateEmail = application.Candidate?.Email;
            var candidateName = application.Candidate != null
                ? $"{application.Candidate.FirstName} {application.Candidate.LastName}".Trim()
                : "Candidate";
            var jobTitle = application.Job?.Title ?? "the position";
            var companyName = application.Job?.Company?.Name ?? "the hiring organization";

            if (!string.IsNullOrWhiteSpace(candidateEmail))
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendAvailabilitySlotRequestEmailAsync(
                            candidateEmail, candidateName, jobTitle, companyName, CancellationToken.None);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send availability slot request email to {Email}", candidateEmail);
                    }
                });
            }

            try
            {
                await _notificationService.CreateNotificationAsync(
                    application.CandidateId,
                    "Action Required: Add Interview Availability",
                    $"You are shortlisted for {jobTitle} at {companyName}! Please add your availability slots in your candidate dashboard so our team can schedule your interview.",
                    NotificationType.APPLICATION_UPDATE,
                    "Application",
                    application.Id,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not create notification for candidate {CandidateId}", application.CandidateId);
            }

            return Result<ApplicationDto>.Failure(
                "The candidate has not provided any availability slots yet. An email notification has been sent requesting them to add their available time slots before interview approval can proceed.",
                400);
        }

        var updateResult = await UpdateApplicationStatusAsync(id, ApplicationStatus.INTERVIEW_APPROVED, recruiterCompanyId, ct);
        if (!updateResult.IsSuccess)
        {
            return updateResult;
        }

        // Prepare availability slots for AI scheduling before launching background task
        var interviewerUser = await _db.Users
            .Where(u => u.CompanyId == recruiterCompanyId && u.Role == UserRole.INTERVIEWER && !u.IsDeleted)
            .FirstOrDefaultAsync(ct);

        var candSlots = await _db.AvailabilitySlots
            .Where(s => s.UserId == application.CandidateId && !s.IsDeleted)
            .Select(s => new
            {
                id = s.Id.ToString(),
                user_id = s.UserId.ToString(),
                role = "CANDIDATE",
                start_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.StartTime),
                end_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.EndTime),
                timezone = s.Timezone
            })
            .ToListAsync(ct);

        var invSlots = interviewerUser != null
            ? await _db.AvailabilitySlots
                .Where(s => s.UserId == interviewerUser.Id && !s.IsDeleted)
                .Select(s => new
                {
                    id = s.Id.ToString(),
                    user_id = s.UserId.ToString(),
                    role = "INTERVIEWER",
                    start_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.StartTime),
                    end_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.EndTime),
                    timezone = s.Timezone
                })
                .ToListAsync(ct)
            : new();

        var candIdStr = application.CandidateId.ToString();
        var invIdStr = interviewerUser?.Id.ToString();

        // Notify AI service to resume LangGraph Stage 2 (Interview Questions & Scheduling)
        if (application.AiWorkflowId.HasValue)
        {
            var wfId = application.AiWorkflowId.Value;
            _ = Task.Run(async () =>
            {
                try
                {
                    await _aiServiceClient.ApproveCandidateEvaluationAsync(
                        wfId,
                        "APPROVED",
                        notes: "Candidate approved for technical interview scheduling",
                        candidateId: candIdStr,
                        interviewerId: invIdStr,
                        candidateSlots: candSlots,
                        interviewerSlots: invSlots,
                        ct: CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to notify AI Service of interview approval for Workflow {WorkflowId}", wfId);
                }
            });
        }

        return updateResult;
    }

    public async Task<Result<SchedulingReadinessDto>> GetSchedulingReadinessAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var application = await _db.Applications
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (application == null)
        {
            return Result<SchedulingReadinessDto>.NotFound("Application not found.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var companyInterviewers = await _db.Users
            .Where(u => u.CompanyId == recruiterCompanyId && u.Role == UserRole.INTERVIEWER && !u.IsDeleted)
            .ToListAsync(ct);

        var interviewerCount = companyInterviewers.Count;
        var interviewerIds = companyInterviewers.Select(u => u.Id).ToList();

        var interviewerSlotCount = await _db.AvailabilitySlots
            .CountAsync(s => interviewerIds.Contains(s.UserId) && !s.IsDeleted && (s.SpecificDate == null || s.SpecificDate >= today), ct);

        var candidateSlotCount = await _db.AvailabilitySlots
            .CountAsync(s => s.UserId == application.CandidateId && !s.IsDeleted && (s.SpecificDate == null || s.SpecificDate >= today), ct);

        var hasInterviewers = interviewerCount > 0;
        var hasInterviewerSlots = interviewerSlotCount > 0;
        var hasCandidateSlots = candidateSlotCount > 0;
        var canApprove = hasInterviewers && hasInterviewerSlots && hasCandidateSlots;

        string? message = null;
        if (!hasInterviewers)
            message = "No interviewers found in your organization. Please add interviewers in Team & Interviewers.";
        else if (!hasInterviewerSlots)
            message = "Interviewers have not published any availability slots yet.";
        else if (!hasCandidateSlots)
            message = "Candidate has not provided availability slots yet. Approving will notify them via email.";

        var dto = new SchedulingReadinessDto
        {
            HasInterviewers = hasInterviewers,
            InterviewerCount = interviewerCount,
            HasInterviewerSlots = hasInterviewerSlots,
            InterviewerSlotCount = interviewerSlotCount,
            HasCandidateSlots = hasCandidateSlots,
            CandidateSlotCount = candidateSlotCount,
            CanApprove = canApprove,
            Message = message
        };

        return Result<SchedulingReadinessDto>.Success(dto);
    }

    public async Task<Result<ApplicationDto>> RejectApplicationAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        var application = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id, ct);
        var updateResult = await UpdateApplicationStatusAsync(id, ApplicationStatus.REJECTED, recruiterCompanyId, ct);
        if (!updateResult.IsSuccess)
        {
            return updateResult;
        }

        if (application?.AiWorkflowId != null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _aiServiceClient.ApproveCandidateEvaluationAsync(
                        application.AiWorkflowId.Value,
                        "REJECTED",
                        notes: "Application rejected by recruiter",
                        ct: CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to notify AI Service of application rejection for Workflow {WorkflowId}", application.AiWorkflowId.Value);
                }
            });
        }

        return updateResult;
    }
}
