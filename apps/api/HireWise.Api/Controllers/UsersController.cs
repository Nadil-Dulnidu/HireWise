using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Users;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(IUserService userService, ICurrentUserService currentUserService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier not found in claims."));
        }

        var result = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "User not found"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier not found in claims."));
        }

        var result = await _userService.UpdateProfileAsync(clerkUserId, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update profile"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "Profile updated successfully"));
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterRequest request, CancellationToken ct)
    {
        // If recruiter, only allow filtering by recruiter's company
        if (_currentUserService.IsRecruiter && _currentUserService.CompanyId.HasValue)
        {
            request.CompanyId = _currentUserService.CompanyId.Value;
        }

        var result = await _userService.GetUsersAsync(request, ct);
        return Ok(ApiResponse<PagedResult<UserDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetUserById(Guid id, CancellationToken ct)
    {
        var result = await _userService.GetUserByIdAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "User not found"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!));
    }

    [HttpPut("{id:guid}/approve")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> ApproveUser(Guid id, [FromBody] ApproveUserRequest request, CancellationToken ct)
    {
        var result = await _userService.ApproveUserAsync(id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to approve user"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "User approved successfully"));
    }

    [HttpPut("{id:guid}/role")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest request, CancellationToken ct)
    {
        var result = await _userService.UpdateRoleAsync(id, request.Role, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update role"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "User role updated successfully"));
    }

    [HttpPut("{id:guid}/company")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> AssignCompany(Guid id, [FromBody] AssignUserCompanyRequest request, CancellationToken ct)
    {
        // Recruiter can only assign to their own company
        if (_currentUserService.IsRecruiter && _currentUserService.CompanyId.HasValue && _currentUserService.CompanyId.Value != request.CompanyId)
        {
            return Forbid();
        }

        var result = await _userService.AssignCompanyAsync(id, request.CompanyId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to assign company"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "Company assigned successfully"));
    }

    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeactivateUser(Guid id, CancellationToken ct)
    {
        var result = await _userService.DeactivateUserAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to deactivate user"));
        }

        return Ok(ApiResponse<bool>.Ok(true, "User deactivated successfully"));
    }

    [HttpGet("interviewers")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetInterviewers([FromQuery] Guid? companyId, CancellationToken ct)
    {
        var targetCompanyId = companyId ?? _currentUserService.CompanyId;
        if (!targetCompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Company ID is required to fetch interviewers."));
        }

        var result = await _userService.GetInterviewersByCompanyAsync(targetCompanyId.Value, ct);
        return Ok(ApiResponse<List<UserDto>>.Ok(result.Value!));
    }
}
