using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Users;
using HireWise.Api.Models.Enums;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

// Controller for managing user profiles, roles, and company team members
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

    // Get the currently authenticated user's profile
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        // Make sure user ID exists in the auth token claims
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier not found in claims."));
        }

        // Fetch user from database
        var result = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "User not found"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!));
    }

    // Update current user's profile details like name and phone
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        // Validate user authentication
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier not found in claims."));
        }

        // Save profile updates to database
        var result = await _userService.UpdateProfileAsync(clerkUserId, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update profile"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "Profile updated successfully"));
    }

    // Update the role for the currently logged-in user
    [HttpPut("me/role")]
    public async Task<IActionResult> UpdateSelfRole([FromBody] UpdateUserRoleRequest request, CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        // Check if user is logged in
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier not found in claims."));
        }

        // Update self role in database
        var result = await _userService.SetSelfRoleAsync(clerkUserId, request.Role, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update role"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "User role updated successfully"));
    }

    // Fetch candidate dashboard overview with stats and upcoming interviews
    [HttpGet("me/dashboard")]
    public async Task<IActionResult> GetCandidateDashboard(CancellationToken ct)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        // Verify user authentication
        if (string.IsNullOrEmpty(clerkUserId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Authenticated user identifier not found in claims."));
        }

        // Load candidate dashboard metrics from database
        var result = await _userService.GetCandidateDashboardAsync(clerkUserId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to fetch dashboard data."));
        }

        return Ok(ApiResponse<CandidateDashboardDto>.Ok(result.Value!));
    }

    // Get paginated users list with search and role filters
    [HttpGet]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterRequest request, CancellationToken ct)
    {
        // If recruiter, only allow filtering by recruiter's company
        if (_currentUserService.IsRecruiter)
        {
            var compId = _currentUserService.CompanyId;
            if (!compId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkUserId))
            {
                var userResult = await _userService.GetCurrentUserAsync(_currentUserService.ClerkUserId, ct);
                if (userResult.IsSuccess)
                {
                    compId = userResult.Value?.CompanyId;
                }
            }

            if (compId.HasValue)
            {
                request.CompanyId = compId.Value;
            }
        }

        // Query matching users from database
        var result = await _userService.GetUsersAsync(request, ct);
        return Ok(ApiResponse<PagedResult<UserDto>>.Ok(result));
    }

    // Get user details by their database ID
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetUserById(Guid id, CancellationToken ct)
    {
        // Look up user by ID
        var result = await _userService.GetUserByIdAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "User not found"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!));
    }

    // Admin endpoint to change any user's role
    [HttpPut("{id:guid}/role")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest request, CancellationToken ct)
    {
        // Save new role to database
        var result = await _userService.UpdateRoleAsync(id, request.Role, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update role"));
        }

        return Ok(ApiResponse<UserDto>.Ok(result.Value!, "User role updated successfully"));
    }

    // Deactivate a user account
    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeactivateUser(Guid id, CancellationToken ct)
    {
        // Mark user as deactivated in database
        var result = await _userService.DeactivateUserAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to deactivate user"));
        }

        return Ok(ApiResponse<bool>.Ok(true, "User deactivated successfully"));
    }

    // Ban a user with a reason
    [HttpPut("{id:guid}/ban")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> BanUser(Guid id, [FromBody] BanUserRequest request, CancellationToken ct)
    {
        // Mark user as banned in database
        var result = await _userService.BanUserAsync(id, request.Reason, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to ban user"));
        }

        return Ok(ApiResponse<bool>.Ok(true, "User banned successfully"));
    }

    // Fetch all interviewers belonging to a specific company
    [HttpGet("interviewers")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetInterviewers([FromQuery] Guid? companyId, CancellationToken ct)
    {
        // Resolve company ID from query or current user context
        var targetCompanyId = companyId ?? _currentUserService.CompanyId;
        if (!targetCompanyId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkUserId))
        {
            var userResult = await _userService.GetCurrentUserAsync(_currentUserService.ClerkUserId, ct);
            if (userResult.IsSuccess)
            {
                targetCompanyId = userResult.Value?.CompanyId;
            }
        }

        // Company ID is mandatory to find interviewers
        if (!targetCompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Company ID is required to fetch interviewers."));
        }

        // Fetch interviewers from database
        var result = await _userService.GetInterviewersByCompanyAsync(targetCompanyId.Value, ct);
        return Ok(ApiResponse<List<UserDto>>.Ok(result.Value!));
    }

    // Fetch team members with their interview assignment stats
    [HttpGet("team")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetTeamMembers([FromQuery] Guid? companyId, CancellationToken ct)
    {
        // Resolve company ID from query or current user context
        var targetCompanyId = companyId ?? _currentUserService.CompanyId;
        if (!targetCompanyId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkUserId))
        {
            var userResult = await _userService.GetCurrentUserAsync(_currentUserService.ClerkUserId, ct);
            if (userResult.IsSuccess)
            {
                targetCompanyId = userResult.Value?.CompanyId;
            }
        }

        // Company context is required to query team members
        if (!targetCompanyId.HasValue)
        {
            return BadRequest(ApiResponse<object>.Fail("Company / Organization context is required to fetch team members."));
        }

        // Query team members from database
        var result = await _userService.GetTeamMembersAsync(targetCompanyId.Value, ct);
        return Ok(ApiResponse<List<TeamMemberDto>>.Ok(result.Value!));
    }
}
