using HireWise.Api.DTOs.Availability;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Authorize]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availabilityService;
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public AvailabilityController(
        IAvailabilityService availabilityService,
        IUserService userService,
        ICurrentUserService currentUserService)
    {
        _availabilityService = availabilityService;
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpGet("api/availability/me")]
    public async Task<IActionResult> GetMyAvailability(CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var slots = await _availabilityService.GetMyAvailabilityAsync(user.Id, ct);
        return Ok(ApiResponse<List<AvailabilitySlotDto>>.Ok(slots));
    }

    [HttpPost("api/availability")]
    public async Task<IActionResult> CreateAvailabilitySlot([FromBody] CreateAvailabilitySlotRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _availabilityService.CreateAvailabilitySlotAsync(user.Id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to create availability slot"));
        }

        return StatusCode(result.StatusCode, ApiResponse<AvailabilitySlotDto>.Ok(result.Value!, "Availability slot created successfully"));
    }

    [HttpPost("api/availability/bulk")]
    public async Task<IActionResult> BulkCreateAvailabilitySlots([FromBody] BulkCreateAvailabilityRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _availabilityService.BulkCreateSlotsAsync(user.Id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to create availability slots in bulk"));
        }

        return StatusCode(result.StatusCode, ApiResponse<List<AvailabilitySlotDto>>.Ok(result.Value!, $"{result.Value!.Count} availability slots saved successfully"));
    }

    [HttpPut("api/availability/{id:guid}")]
    public async Task<IActionResult> UpdateAvailabilitySlot(Guid id, [FromBody] UpdateAvailabilitySlotRequest request, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _availabilityService.UpdateAvailabilitySlotAsync(id, user.Id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update availability slot"));
        }

        return Ok(ApiResponse<AvailabilitySlotDto>.Ok(result.Value!, "Availability slot updated successfully"));
    }

    [HttpDelete("api/availability/{id:guid}")]
    public async Task<IActionResult> DeleteAvailabilitySlot(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null) return Unauthorized(ApiResponse<object>.Fail("User profile not found."));

        var result = await _availabilityService.DeleteAvailabilitySlotAsync(id, user.Id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to delete availability slot"));
        }

        return Ok(ApiResponse<object>.Ok(new { }, "Availability slot deleted successfully"));
    }

    [HttpGet("api/availability/interviewer/{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetInterviewerAvailability(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        if (user == null || !user.CompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _availabilityService.GetInterviewerAvailabilityAsync(id, user.CompanyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to retrieve interviewer availability"));
        }

        return Ok(ApiResponse<List<AvailabilitySlotDto>>.Ok(result.Value!));
    }

    [HttpGet("api/availability/candidate/{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetCandidateAvailability(Guid id, CancellationToken ct)
    {
        var user = await GetCurrentDbUserAsync(ct);
        var isAdmin = _currentUserService.IsAdmin;
        var companyId = user?.CompanyId ?? _currentUserService.CompanyId;

        if (!isAdmin && !companyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Recruiter must be assigned to a company."));
        }

        var result = await _availabilityService.GetCandidateAvailabilityAsync(id, companyId, isAdmin, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to retrieve candidate availability"));
        }

        return Ok(ApiResponse<List<AvailabilitySlotDto>>.Ok(result.Value!));
    }

    private async Task<DTOs.Users.UserDto?> GetCurrentDbUserAsync(CancellationToken ct)
    {
        var clerkId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkId)) return null;

        var userResult = await _userService.GetCurrentUserAsync(clerkId, ct);
        return userResult.IsSuccess ? userResult.Value : null;
    }
}
