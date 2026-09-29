using HireWise.Api.Data;
using HireWise.Api.DTOs.AiCallback;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/internal/ai-callback")]
[AllowAnonymous]
public class AiCallbackController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _config;
    private readonly ILogger<AiCallbackController> _logger;

    public AiCallbackController(
        ApplicationDbContext db,
        INotificationService notificationService,
        IConfiguration config,
        ILogger<AiCallbackController> logger)
    {
        _db = db;
        _notificationService = notificationService;
        _config = config;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> HandleAiCallback([FromBody] AiCallbackRequest request, CancellationToken ct)
    {
        // 1. Validate internal service secret header
        var expectedKey = _config["AiService:InternalCallbackKey"]
            ?? _config["AI_SERVICE_INTERNAL_KEY"]
            ?? _config["DOTNET_API_INTERNAL_KEY"]
            ?? "hw_internal_callback_key";

        if (!Request.Headers.TryGetValue("X-Internal-Key", out var providedKey) || providedKey != expectedKey)
        {
            _logger.LogWarning("Unauthorized attempt to access AI callback endpoint with invalid X-Internal-Key.");
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid or missing internal service key." });
        }

        _logger.LogInformation("Received AI callback for Application {ApplicationId} with Status {Status}, Workflow {WorkflowId}",
            request.ApplicationId, request.Status, request.WorkflowId);

        // 2. Fetch Application record
        var application = await _db.Applications
            .Include(a => a.Job).ThenInclude(j => j.Company)
            .Include(a => a.Candidate)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct);

        if (application == null)
        {
            _logger.LogWarning("Application {ApplicationId} referenced in AI callback not found.", request.ApplicationId);
            return NotFound(new { message = $"Application {request.ApplicationId} not found." });
        }

        // 3. Update Application state and link AI workflow
        application.AiWorkflowId = request.WorkflowId;

        if (request.Status == "AWAITING_APPROVAL")
        {
            application.Status = ApplicationStatus.AI_RECOMMENDED;
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Application {ApplicationId} updated to AI_RECOMMENDED.", application.Id);

            // Notify candidate
            await _notificationService.CreateNotificationAsync(
                application.CandidateId,
                "Application AI Review Complete",
                $"Your application for '{application.Job.Title}' has completed preliminary evaluation and is now under recruiter review.",
                NotificationType.AI_EVALUATION_COMPLETE,
                "Application",
                application.Id,
                ct);

            // Notify recruiter/job creator
            if (application.Job.CreatedByUserId != Guid.Empty)
            {
                await _notificationService.CreateNotificationAsync(
                    application.Job.CreatedByUserId,
                    "AI Evaluation Ready For Review",
                    $"AI analysis completed for {application.Candidate.FirstName} {application.Candidate.LastName} ({application.Job.Title}). Recommendation is awaiting your review.",
                    NotificationType.APPROVAL_REQUIRED,
                    "Application",
                    application.Id,
                    ct);
            }
        }
        else if (request.Status == "AWAITING_SCHEDULE_APPROVAL")
        {
            application.Status = ApplicationStatus.INTERVIEW_APPROVED;
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Application {ApplicationId} updated to INTERVIEW_APPROVED (awaiting schedule confirmation).", application.Id);

            // Notify recruiter to confirm the interview slot
            if (application.Job.CreatedByUserId != Guid.Empty)
            {
                await _notificationService.CreateNotificationAsync(
                    application.Job.CreatedByUserId,
                    "Interview Slot Ready for Confirmation",
                    $"AI has recommended interview slots for {application.Candidate.FirstName} {application.Candidate.LastName} ({application.Job.Title}). Please confirm a time slot.",
                    NotificationType.APPROVAL_REQUIRED,
                    "Application",
                    application.Id,
                    ct);
            }
        }
        else if (request.Status == "COMPLETED")
        {
            application.Status = ApplicationStatus.INTERVIEW_SCHEDULED;
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Application {ApplicationId} updated to INTERVIEW_SCHEDULED.", application.Id);

            // Notify candidate the interview is confirmed
            await _notificationService.CreateNotificationAsync(
                application.CandidateId,
                "Interview Scheduled",
                $"Congratulations! Your interview for '{application.Job.Title}' has been scheduled. Check your dashboard for details.",
                NotificationType.AI_EVALUATION_COMPLETE,
                "Application",
                application.Id,
                ct);

            // Notify recruiter
            if (application.Job.CreatedByUserId != Guid.Empty)
            {
                await _notificationService.CreateNotificationAsync(
                    application.Job.CreatedByUserId,
                    "Interview Confirmed",
                    $"Interview for {application.Candidate.FirstName} {application.Candidate.LastName} ({application.Job.Title}) has been successfully scheduled.",
                    NotificationType.APPROVAL_REQUIRED,
                    "Application",
                    application.Id,
                    ct);
            }
        }
        else if (request.Status == "FAILED")
        {
            _logger.LogWarning("AI evaluation workflow failed for Application {ApplicationId}.", application.Id);
            await _db.SaveChangesAsync(ct);
        }

        return Ok(new
        {
            success = true,
            message = "AI workflow completion callback processed successfully.",
            applicationId = application.Id,
            status = application.Status.ToString()
        });
    }
}
