using System.Security.Claims;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.Services;

public interface ICurrentUserService
{
    string? ClerkUserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    Guid? UserId { get; }
    Guid? CompanyId { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    bool IsRecruiter { get; }
    bool IsInterviewer { get; }
    bool IsCandidate { get; }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? ClerkUserId =>
        User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
        User?.FindFirst("sub")?.Value;

    public string? Email =>
        User?.FindFirst(ClaimTypes.Email)?.Value ??
        User?.FindFirst("email")?.Value;

    public UserRole? Role
    {
        get
        {
            var roleStr = User?.FindFirst(ClaimTypes.Role)?.Value ??
                          User?.FindFirst("role")?.Value ??
                          User?.FindFirst("org_role")?.Value;

            if (string.IsNullOrEmpty(roleStr)) return null;

            if (Enum.TryParse<UserRole>(roleStr, true, out var role))
            {
                return role;
            }

            return null;
        }
    }

    public Guid? UserId
    {
        get
        {
            var userIdStr = User?.FindFirst("user_id")?.Value;
            return Guid.TryParse(userIdStr, out var id) ? id : null;
        }
    }

    public Guid? CompanyId
    {
        get
        {
            var companyIdStr = User?.FindFirst("company_id")?.Value;
            return Guid.TryParse(companyIdStr, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
    public bool IsAdmin => Role == UserRole.ADMIN;
    public bool IsRecruiter => Role == UserRole.RECRUITER;
    public bool IsInterviewer => Role == UserRole.INTERVIEWER;
    public bool IsCandidate => Role == UserRole.CANDIDATE;
}
