using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Applications;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services.Ai;
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
}

public class ApplicationService : IApplicationService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly IAiServiceClient _aiServiceClient;
    private readonly ILogger<ApplicationService> _logger;

    public ApplicationService(
        ApplicationDbContext db,
        IMapper mapper,
        INotificationService notificationService,
        IAiServiceClient aiServiceClient,
        ILogger<ApplicationService> logger)
    {
        _db = db;
        _mapper = mapper;
        _notificationService = notificationService;
        _aiServiceClient = aiServiceClient;
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

        // 6. Transition to AI_REVIEW and trigger AI evaluation in background
        application.Status = ApplicationStatus.AI_REVIEW;
        await _db.SaveChangesAsync(ct);

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
                    CancellationToken.None);
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

        return Result<ApplicationDto>.Success(_mapper.Map<ApplicationDto>(application));
    }

    public async Task<Result<ApplicationDto>> ApproveForInterviewAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        return await UpdateApplicationStatusAsync(id, ApplicationStatus.INTERVIEW_APPROVED, recruiterCompanyId, ct);
    }

    public async Task<Result<ApplicationDto>> RejectApplicationAsync(Guid id, Guid recruiterCompanyId, CancellationToken ct = default)
    {
        return await UpdateApplicationStatusAsync(id, ApplicationStatus.REJECTED, recruiterCompanyId, ct);
    }
}
