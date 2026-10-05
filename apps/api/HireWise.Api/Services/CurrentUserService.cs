using System.Security.Claims;
using HireWise.Api.Models.Enums;

namespace HireWise.Api.Services;

public interface ICurrentUserService
{
    string? ClerkUserId { get; }
    string? Email { get; }
    string? FirstName { get; }
    string? LastName { get; }
    UserRole? Role { get; }
    Guid? UserId { get; }
    Guid? CompanyId { get; }
    string? ClerkOrganizationId { get; }
    string? OrgRole { get; }
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
        User?.FindFirst("email")?.Value ??
        _httpContextAccessor.HttpContext?.Request.Headers["X-Clerk-Email"].FirstOrDefault();

    public string? FirstName =>
        User?.FindFirst(ClaimTypes.GivenName)?.Value ??
        User?.FindFirst("given_name")?.Value ??
        User?.FindFirst("first_name")?.Value;

    public string? LastName =>
        User?.FindFirst(ClaimTypes.Surname)?.Value ??
        User?.FindFirst("family_name")?.Value ??
        User?.FindFirst("last_name")?.Value;

    public string? ClerkOrganizationId =>
        User?.FindFirst("org_id")?.Value ??
        User?.FindFirst("organization_id")?.Value ??
        _httpContextAccessor.HttpContext?.Request.Headers["X-Clerk-Org-Id"].FirstOrDefault();

    public string? OrgRole =>
        User?.FindFirst("org_role")?.Value;

    public UserRole? Role
    {
        get
        {
            var roleStr = User?.FindFirst(ClaimTypes.Role)?.Value ??
                          User?.FindFirst("role")?.Value ??
                          _httpContextAccessor.HttpContext?.Request.Headers["X-Clerk-Role"].FirstOrDefault();

            if (string.IsNullOrEmpty(roleStr))
            {
                // Fallback to org_role mapping: org:admin -> RECRUITER, org:member -> INTERVIEWER
                var orgRole = OrgRole;
                if (!string.IsNullOrEmpty(orgRole))
                {
                    return orgRole == "org:admin" ? UserRole.RECRUITER : UserRole.INTERVIEWER;
                }

                return null;
            }

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
            // First check if set in HttpContext Items by middleware
            if (_httpContextAccessor.HttpContext?.Items.TryGetValue("CompanyId", out var itemCompanyId) == true && itemCompanyId is Guid guid)
            {
                return guid;
            }

            var companyIdStr = User?.FindFirst("company_id")?.Value;
            return Guid.TryParse(companyIdStr, out var id) ? id : null;
        }
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
    public bool IsAdmin => Role == UserRole.ADMIN;
    public bool IsRecruiter => Role == UserRole.RECRUITER;
    public bool IsInterviewer => Role == UserRole.INTERVIEWER;
    public bool IsCandidate => Role == UserRole.CANDIDATE || (!IsAdmin && !IsRecruiter && !IsInterviewer);
}
