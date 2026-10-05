using HireWise.Api.DTOs.Applications;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

// Controller managing job application submissions, reviews, status updates, and interview approvals
[ApiController]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public ApplicationsController(
        IApplicationService applicationService,
        IUserService userService,
        ICurrentUserService currentUserService)
    {
        _applicationService = applicationService;
        _userService = userService;
        _currentUserService = currentUserService;
    }

    // Submit a candidate application for a specific job
    [HttpPost("api/jobs/{jobId:guid}/applications")]
    public async Task<IActionResult> ApplyToJob(Guid jobId, [FromBody] ApplyJobRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _applicationService.ApplyToJobAsync(jobId, user.Id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to submit application"));
        }

        return StatusCode(result.StatusCode, ApiResponse<ApplicationDto>.Ok(result.Value!, "Application submitted successfully"));
    }

    // Get paginated applications submitted by the current candidate
    [HttpGet("api/applications/me")]
    public async Task<IActionResult> GetMyApplications([FromQuery] PagedRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _applicationService.GetCandidateApplicationsAsync(user.Id, request, ct);
        return Ok(ApiResponse<PagedResult<ApplicationDto>>.Ok(result));
    }

    // Get application details by ID with role and company authorization
    [HttpGet("api/applications/{id:guid}")]
    public async Task<IActionResult> GetApplicationById(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var roleStr = _currentUserService.Role?.ToString() ?? "CANDIDATE";
        var companyId = user.CompanyId;

        var result = await _applicationService.GetApplicationByIdAsync(id, user.Id, roleStr, companyId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Application not found"));
        }

        return Ok(ApiResponse<ApplicationDetailDto>.Ok(result.Value!));
    }

    // Get applications submitted to a specific job for company recruiters
    [HttpGet("api/jobs/{jobId:guid}/applications")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetJobApplications(Guid jobId, [FromQuery] ApplicationFilterRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _applicationService.GetJobApplicationsAsync(jobId, request, user.CompanyId.Value, ct);
        return Ok(ApiResponse<PagedResult<ApplicationDto>>.Ok(result));
    }

    // Get all company job applications with optional status and search filters
    [HttpGet("api/applications")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetCompanyApplications([FromQuery] ApplicationFilterRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _applicationService.GetCompanyApplicationsAsync(request, user.CompanyId.Value, ct);
        return Ok(ApiResponse<PagedResult<ApplicationDto>>.Ok(result));
    }

    // Update the status of a specific job application
    [HttpPut("api/applications/{id:guid}/status")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> UpdateApplicationStatus(Guid id, [FromBody] ChangeApplicationStatusRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _applicationService.UpdateApplicationStatusAsync(id, request.Status, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update application status"));
        }

        return Ok(ApiResponse<ApplicationDto>.Ok(result.Value!, "Application status updated successfully"));
    }

    // Approve an application to proceed to interview scheduling
    [HttpPut("api/applications/{id:guid}/approve-interview")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> ApproveForInterview(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _applicationService.ApproveForInterviewAsync(id, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to approve application for interview"));
        }

        return Ok(ApiResponse<ApplicationDto>.Ok(result.Value!, "Application approved for interview scheduling"));
    }

    // Check if an application is ready for interview scheduling
    [HttpGet("api/applications/{id:guid}/scheduling-readiness")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetSchedulingReadiness(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _applicationService.GetSchedulingReadinessAsync(id, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to check scheduling readiness"));
        }

        return Ok(ApiResponse<SchedulingReadinessDto>.Ok(result.Value!));
    }

    // Reject a job application and notify candidate
    [HttpPut("api/applications/{id:guid}/reject")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> RejectApplication(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _applicationService.RejectApplicationAsync(id, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to reject application"));
        }

        return Ok(ApiResponse<ApplicationDto>.Ok(result.Value!, "Application marked as rejected"));
    }

    // Look up the current database user profile using Clerk user ID
    private async Task<DTOs.Users.UserDto?> GetCurrentDbUserAsync(CancellationToken ct)
    {
        var clerkId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkId)) return null;

        var userResult = await _userService.GetCurrentUserAsync(clerkId, ct);
        return userResult.IsSuccess ? userResult.Value : null;
    }
}
