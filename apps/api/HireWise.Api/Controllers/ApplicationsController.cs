using HireWise.Api.DTOs.Applications;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

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

    [HttpGet("api/applications/me")]
    public async Task<IActionResult> GetMyApplications([FromQuery] PagedRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _applicationService.GetCandidateApplicationsAsync(user.Id, request, ct);
        return Ok(ApiResponse<PagedResult<ApplicationDto>>.Ok(result));
    }

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

    private async Task<DTOs.Users.UserDto?> GetCurrentDbUserAsync(CancellationToken ct)
    {
        var clerkId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkId)) return null;

        var userResult = await _userService.GetCurrentUserAsync(clerkId, ct);
        return userResult.IsSuccess ? userResult.Value : null;
    }
}
