using System.Text.Json.Serialization;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.DTOs.Users;

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
    public int AssignedInterviewsCount { get; set; }
    public int CompletedFeedbacksCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ProfileImageUrl { get; set; }
}

public class UpdateUserRoleRequest
{
    public UserRole Role { get; set; }
}

public class BanUserRequest
{
    public string? Reason { get; set; }
}

public class UserFilterRequest : Common.PagedRequest
{
    public UserRole? Role { get; set; }
    public UserStatus? Status { get; set; }
    public Guid? CompanyId { get; set; }
}
