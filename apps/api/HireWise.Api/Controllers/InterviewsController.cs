using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Interviews;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Authorize]
public class InterviewsController : ControllerBase
{
    private readonly IInterviewService _interviewService;
    private readonly IInterviewFeedbackService _feedbackService;
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public InterviewsController(
        IInterviewService interviewService,
        IInterviewFeedbackService feedbackService,
        IUserService userService,
        ICurrentUserService currentUserService)
    {
        _interviewService = interviewService;
        _feedbackService = feedbackService;
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpPost("api/interviews")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> CreateInterview([FromBody] CreateInterviewRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _interviewService.CreateInterviewAsync(request, user.CompanyId.Value, user.Id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to create interview"));
        }

        return StatusCode(result.StatusCode, ApiResponse<InterviewDto>.Ok(result.Value!, "Interview scheduled successfully"));
    }

    [HttpGet("api/interviews")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetInterviews([FromQuery] InterviewFilterRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var roleStr = _currentUserService.Role?.ToString() ?? user.Role.ToString();
        var result = await _interviewService.GetInterviewsAsync(request, user.Id, roleStr, user.CompanyId, ct);
        return Ok(ApiResponse<PagedResult<InterviewDto>>.Ok(result));
    }

    [HttpGet("api/interviews/me")]
    public async Task<IActionResult> GetMyInterviews([FromQuery] PagedRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var roleStr = _currentUserService.Role?.ToString() ?? user.Role.ToString();
        var result = await _interviewService.GetMyInterviewsAsync(user.Id, roleStr, request, ct);
        return Ok(ApiResponse<PagedResult<InterviewDto>>.Ok(result));
    }

    [HttpGet("api/interviews/{id:guid}")]
    public async Task<IActionResult> GetInterviewById(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var roleStr = _currentUserService.Role?.ToString() ?? user.Role.ToString();
        var result = await _interviewService.GetInterviewByIdAsync(id, user.Id, roleStr, user.CompanyId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Interview not found"));
        }

        return Ok(ApiResponse<InterviewDetailDto>.Ok(result.Value!));
    }

    [HttpPut("api/interviews/{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> UpdateInterview(Guid id, [FromBody] UpdateInterviewRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _interviewService.UpdateInterviewAsync(id, request, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update interview"));
        }

        return Ok(ApiResponse<InterviewDto>.Ok(result.Value!, "Interview updated successfully"));
    }

    [HttpPut("api/interviews/{id:guid}/cancel")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> CancelInterview(Guid id, [FromBody] string? reason, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _interviewService.CancelInterviewAsync(id, reason, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to cancel interview"));
        }

        return Ok(ApiResponse<InterviewDto>.Ok(result.Value!, "Interview cancelled successfully"));
    }

    [HttpPut("api/interviews/{id:guid}/complete")]
    [Authorize(Roles = "ADMIN,INTERVIEWER")]
    public async Task<IActionResult> CompleteInterview(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _interviewService.CompleteInterviewAsync(id, user.Id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to complete interview"));
        }

        return Ok(ApiResponse<InterviewDto>.Ok(result.Value!, "Interview marked as completed"));
    }

    [HttpPost("api/interviews/{id:guid}/feedback")]
    [Authorize(Roles = "ADMIN,INTERVIEWER")]
    public async Task<IActionResult> SubmitFeedback(Guid id, [FromBody] SubmitFeedbackRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _feedbackService.SubmitFeedbackAsync(id, user.Id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to submit feedback"));
        }

        return StatusCode(result.StatusCode, ApiResponse<InterviewFeedbackDto>.Ok(result.Value!, "Interview feedback submitted successfully"));
    }

    [HttpGet("api/interviews/{id:guid}/feedback")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetFeedback(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var roleStr = _currentUserService.Role?.ToString() ?? user.Role.ToString();
        var result = await _feedbackService.GetFeedbackByInterviewIdAsync(id, user.Id, roleStr, user.CompanyId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Feedback not found"));
        }

        return Ok(ApiResponse<InterviewFeedbackDto>.Ok(result.Value!));
    }

    [HttpPut("api/feedback/{id:guid}")]
    [Authorize(Roles = "ADMIN,INTERVIEWER")]
    public async Task<IActionResult> UpdateFeedback(Guid id, [FromBody] UpdateFeedbackRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _feedbackService.UpdateFeedbackAsync(id, user.Id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update feedback"));
        }

        return Ok(ApiResponse<InterviewFeedbackDto>.Ok(result.Value!, "Feedback updated successfully"));
    }

    private async Task<DTOs.Users.UserDto?> GetCurrentDbUserAsync(CancellationToken ct)
    {
        var clerkId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkId)) return null;

        var userResult = await _userService.GetCurrentUserAsync(clerkId, ct);
        return userResult.IsSuccess ? userResult.Value : null;
    }
}
