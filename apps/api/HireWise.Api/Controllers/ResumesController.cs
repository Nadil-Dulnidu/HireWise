using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Resumes;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

// Controller handling resume upload, retrieval, download, and deletion endpoints
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResumesController : ControllerBase
{
    private readonly IResumeService _resumeService;
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public ResumesController(
        IResumeService resumeService,
        IUserService userService,
        ICurrentUserService currentUserService)
    {
        _resumeService = resumeService;
        _userService = userService;
        _currentUserService = currentUserService;
    }

    // Upload a new resume file for the current authenticated user
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadResume(IFormFile file, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _resumeService.UploadResumeAsync(user.Id, file, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to upload resume"));
        }

        return Ok(ApiResponse<UploadResumeResponse>.Ok(result.Value!, "Resume uploaded successfully"));
    }

    // Get the current user's active resume details
    [HttpGet("me")]
    public async Task<IActionResult> GetMyActiveResume(CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _resumeService.GetActiveResumeAsync(user.Id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "No active resume found"));
        }

        return Ok(ApiResponse<ResumeDto>.Ok(result.Value!));
    }

    // Retrieve resume details by ID with role-based access checks
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetResumeById(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var roleStr = _currentUserService.Role?.ToString() ?? "CANDIDATE";
        var result = await _resumeService.GetResumeByIdAsync(id, user.Id, roleStr, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Resume not found"));
        }

        return Ok(ApiResponse<ResumeDto>.Ok(result.Value!));
    }

    // Download the resume document file by ID
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadResume(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized();

        var roleStr = _currentUserService.Role?.ToString() ?? "CANDIDATE";
        var fileData = await _resumeService.DownloadResumeAsync(id, user.Id, roleStr, ct);
        if (fileData == null)
        {
            return NotFound(ApiResponse<object>.Fail("Resume file not found on server"));
        }

        return File(fileData.Value.Stream, fileData.Value.ContentType, fileData.Value.FileName);
    }

    // Delete a specific resume belonging to the current user
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteResume(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized();

        var result = await _resumeService.DeleteResumeAsync(id, user.Id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to delete resume"));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Resume deleted successfully"));
    }

    // Helper method to look up current database user by Clerk ID
    private async Task<DTOs.Users.UserDto?> GetCurrentDbUserAsync(CancellationToken ct)
    {
        var clerkId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkId)) return null;

        var userResult = await _userService.GetCurrentUserAsync(clerkId, ct);
        return userResult.IsSuccess ? userResult.Value : null;
    }
}
