using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using HireWise.Api.Services.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiWorkflowsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IAiServiceClient _aiServiceClient;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserService _userService;
    private readonly ILogger<AiWorkflowsController> _logger;

    public AiWorkflowsController(
        ApplicationDbContext db,
        IAiServiceClient aiServiceClient,
        ICurrentUserService currentUserService,
        IUserService userService,
        ILogger<AiWorkflowsController> logger)
    {
        _db = db;
        _aiServiceClient = aiServiceClient;
        _currentUserService = currentUserService;
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("evaluations")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetAiEvaluations([FromQuery] Guid? jobId, [FromQuery] string? statusFilter, CancellationToken ct)
    {
        var companyId = _currentUserService.CompanyId;
        if (!companyId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkUserId))
        {
            var userResult = await _userService.GetCurrentUserAsync(_currentUserService.ClerkUserId, ct);
            if (userResult.IsSuccess)
            {
                companyId = userResult.Value?.CompanyId;
            }
        }

        if (!_currentUserService.IsAdmin && !companyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var query = _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .AsNoTracking();

        if (!_currentUserService.IsAdmin && companyId.HasValue)
        {
            query = query.Where(a => a.Job.CompanyId == companyId.Value);
        }

        if (jobId.HasValue)
        {
            query = query.Where(a => a.JobId == jobId.Value);
        }

        if (!string.IsNullOrEmpty(statusFilter) && Enum.TryParse<ApplicationStatus>(statusFilter, true, out var parsedStatus))
        {
            query = query.Where(a => a.Status == parsedStatus);
        }

        var evaluations = await query
            .OrderByDescending(a => a.AppliedAt)
            .Select(a => new
            {
                id = a.Id,
                jobId = a.JobId,
                jobTitle = a.Job.Title,
                companyName = a.Job.Company.Name,
                candidateId = a.CandidateId,
                candidateName = $"{a.Candidate.FirstName} {a.Candidate.LastName}".Trim(),
                candidateEmail = a.Candidate.Email,
                resumeUrl = a.ResumeSnapshotUrl,
                status = a.Status.ToString(),
                aiWorkflowId = a.AiWorkflowId,
                appliedAt = a.AppliedAt
            })
            .ToListAsync(ct);

        return Ok(ApiResponse<object>.Ok(evaluations));
    }

    [HttpGet("applications/{applicationId:guid}/workflow")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetApplicationWorkflow(Guid applicationId, CancellationToken ct)
    {
        var application = await _db.Applications
            .Include(a => a.Job)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == applicationId, ct);

        if (application == null)
        {
            return NotFound(ApiResponse<object>.Fail("Application not found."));
        }

        if (!application.AiWorkflowId.HasValue)
        {
            return NotFound(ApiResponse<object>.Fail("No AI workflow has been initiated for this application yet."));
        }

        var workflowDetails = await _aiServiceClient.GetWorkflowDetailsAsync(application.AiWorkflowId.Value, ct);
        if (workflowDetails == null)
        {
            return NotFound(ApiResponse<object>.Fail("AI workflow details could not be retrieved from the AI service."));
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            applicationId = application.Id,
            jobTitle = application.Job.Title,
            candidateName = $"{application.Candidate.FirstName} {application.Candidate.LastName}".Trim(),
            workflow = workflowDetails
        }));
    }

    [HttpGet("workflows/{workflowId:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetWorkflowDetails(Guid workflowId, CancellationToken ct)
    {
        var details = await _aiServiceClient.GetWorkflowDetailsAsync(workflowId, ct);
        if (details == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Workflow with ID {workflowId} not found in AI service."));
        }

        return Ok(ApiResponse<object>.Ok(details));
    }

    [HttpGet("workflows/{workflowId:guid}/steps")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetWorkflowSteps(Guid workflowId, CancellationToken ct)
    {
        var steps = await _aiServiceClient.GetWorkflowStepsAsync(workflowId, ct);
        if (steps == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Workflow steps for {workflowId} not found in AI service."));
        }

        return Ok(ApiResponse<object>.Ok(steps));
    }

    [HttpPost("applications/{applicationId:guid}/evaluate")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> TriggerEvaluation(Guid applicationId, CancellationToken ct)
    {
        var application = await _db.Applications
            .Include(a => a.Job)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == applicationId, ct);

        if (application == null)
        {
            return NotFound(ApiResponse<object>.Fail("Application not found."));
        }

        if (string.IsNullOrEmpty(application.ResumeSnapshotUrl))
        {
            return BadRequest(ApiResponse<object>.Fail("Application does not have an attached resume snapshot."));
        }

        application.Status = ApplicationStatus.AI_REVIEW;
        await _db.SaveChangesAsync(ct);

        // Fetch candidate availability slots
        var candidateSlots = await _db.AvailabilitySlots
            .Where(s => s.UserId == application.CandidateId)
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

        // Fetch company interviewer availability slots
        var interviewerSlots = await _db.AvailabilitySlots
            .Where(s => s.User.CompanyId == application.Job.CompanyId && s.User.Role == UserRole.INTERVIEWER)
            .Select(s => new
            {
                id = s.Id.ToString(),
                user_id = s.UserId.ToString(),
                role = "INTERVIEWER",
                start_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.StartTime),
                end_time = DateTime.UtcNow.Date.AddDays(((int)s.DayOfWeek - (int)DateTime.UtcNow.DayOfWeek + 7) % 7).Add(s.EndTime),
                timezone = s.Timezone
            })
            .ToListAsync(ct);

        var firstInterviewerId = await _db.Users
            .Where(u => u.CompanyId == application.Job.CompanyId && u.Role == UserRole.INTERVIEWER)
            .Select(u => (Guid?)u.Id)
            .FirstOrDefaultAsync(ct);

        var success = await _aiServiceClient.TriggerApplicationEvaluationAsync(
            application.Id,
            application.Job.Title,
            application.Job.Description,
            application.Job.Requirements,
            application.ResumeSnapshotUrl,
            candidateId: application.CandidateId.ToString(),
            interviewerId: firstInterviewerId?.ToString(),
            candidateSlots: candidateSlots,
            interviewerSlots: interviewerSlots,
            ct: ct);

        if (!success)
        {
            return StatusCode(500, ApiResponse<object>.Fail("Failed to trigger evaluation workflow in AI service. Ensure AI service is running."));
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            applicationId = application.Id,
            status = application.Status.ToString(),
            message = "AI evaluation workflow successfully triggered."
        }));
    }
}
