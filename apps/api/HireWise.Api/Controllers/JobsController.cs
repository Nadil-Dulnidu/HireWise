using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Jobs;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// Handles API requests related to job postings
public class JobsController : ControllerBase
{
    private readonly IJobService _jobService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserService _userService;

    public JobsController(
        IJobService jobService,
        ICurrentUserService currentUserService,
        IUserService userService)
    {
        _jobService = jobService;
        _currentUserService = currentUserService;
        _userService = userService;
    }

    [HttpGet]
    [AllowAnonymous]
    // Get jobs based on the user's access level and filters
    public async Task<IActionResult> GetJobs([FromQuery] JobFilterRequest request, [FromQuery] bool publicOnly = false, CancellationToken ct = default)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsCandidate || publicOnly)
        {
            var publicResult = await _jobService.GetPublicJobsAsync(request, ct);
            return Ok(ApiResponse<PagedResult<JobSummaryDto>>.Ok(publicResult));
        }

        Guid? companyScope = _currentUserService.CompanyId;

        if (_currentUserService.IsRecruiter && !companyScope.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkUserId))
        {
            var userResult = await _userService.GetCurrentUserAsync(_currentUserService.ClerkUserId, ct);
            if (userResult.IsSuccess)
            {
                companyScope = userResult.Value?.CompanyId;
            }
        }

        var result = await _jobService.GetJobsAsync(request, companyScope, _currentUserService.IsAdmin, ct);
        return Ok(ApiResponse<PagedResult<JobDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    // Get a specific job posting by its ID
    public async Task<IActionResult> GetJobById(Guid id, CancellationToken ct)
    {
        var isStaff = _currentUserService.IsAdmin || _currentUserService.IsRecruiter || _currentUserService.IsInterviewer;
        var userCompanyId = _currentUserService.CompanyId;

        var result = await _jobService.GetJobByIdAsync(id, userCompanyId, isStaff, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Job not found"));
        }

        return Ok(ApiResponse<JobDto>.Ok(result.Value!));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Create a new job posting
    public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request, CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier required."));
        }

        var userResult = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!userResult.IsSuccess || userResult.Value == null)
        {
            return StatusCode(userResult.StatusCode, ApiResponse<object>.Fail(userResult.Error ?? "User record not found"));
        }

        var user = userResult.Value;

        var targetCompanyId = request.CompanyId ?? user.CompanyId;
        if (!targetCompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("You must be assigned to a company or specify a valid CompanyId to post jobs."));
        }

        if (!_currentUserService.IsAdmin && user.CompanyId.HasValue && targetCompanyId.Value != user.CompanyId.Value)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You cannot post jobs for another company."));
        }

        var result = await _jobService.CreateJobAsync(request, user.Id, targetCompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to create job"));
        }

        return CreatedAtAction(nameof(GetJobById), new { id = result.Value!.Id }, ApiResponse<JobDto>.Ok(result.Value!, "Job posting created successfully"));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Update an existing job posting
    public async Task<IActionResult> UpdateJob(Guid id, [FromBody] UpdateJobRequest request, CancellationToken ct)
    {
        var userCompanyId = _currentUserService.CompanyId;
        var result = await _jobService.UpdateJobAsync(id, request, userCompanyId, _currentUserService.IsAdmin, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update job"));
        }

        return Ok(ApiResponse<JobDto>.Ok(result.Value!, "Job posting updated successfully"));
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Update the status of a specific job posting
    public async Task<IActionResult> UpdateJobStatus(Guid id, [FromBody] UpdateJobStatusRequest request, CancellationToken ct)
    {
        var userCompanyId = _currentUserService.CompanyId;
        var result = await _jobService.UpdateJobStatusAsync(id, request.Status, userCompanyId, _currentUserService.IsAdmin, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update job status"));
        }

        return Ok(ApiResponse<JobDto>.Ok(result.Value!, $"Job status updated to {request.Status} successfully"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Delete a specific job posting
    public async Task<IActionResult> DeleteJob(Guid id, CancellationToken ct)
    {
        var userCompanyId = _currentUserService.CompanyId;
        var result = await _jobService.DeleteJobAsync(id, userCompanyId, _currentUserService.IsAdmin, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to delete job"));
        }

        return Ok(ApiResponse<object>.Ok(new { deleted = true }, "Job posting deleted successfully"));
    }
}
