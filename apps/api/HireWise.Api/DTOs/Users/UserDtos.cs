using System.Text.Json.Serialization;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.DTOs.Users;

// User details returned to the client
public class UserDto
{
    public Guid Id { get; set; }
    public string ClerkUserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Company team member summary with interview activity stats
public class TeamMemberDto
{
    public Guid Id { get; set; }
    public string ClerkUserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; }
    public string? ProfileImageUrl { get; set; }
    // Interview assignment counts for tracking interviewer workload
    public int AssignedInterviewsCount { get; set; }
    public int CompletedFeedbacksCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Payload for updating candidate profile information
public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ProfileImageUrl { get; set; }
}

// Request to update a user's system role
public class UpdateUserRoleRequest
{
    public UserRole Role { get; set; }
}

// Request to ban a user with an optional reason
public class BanUserRequest
{
    public string? Reason { get; set; }
}

// Query parameters for filtering and paginating users
public class UserFilterRequest : Common.PagedRequest
{
    public UserRole? Role { get; set; }
    public UserStatus? Status { get; set; }
    public Guid? CompanyId { get; set; }
}
