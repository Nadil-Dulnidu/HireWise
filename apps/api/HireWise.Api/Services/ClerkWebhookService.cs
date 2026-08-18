using System.Text.Json;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Auth;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IClerkWebhookService
{
    Task<bool> HandleWebhookAsync(string payload, IHeaderDictionary headers, CancellationToken ct = default);
}

public class ClerkWebhookService : IClerkWebhookService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ClerkWebhookService> _logger;

    public ClerkWebhookService(ApplicationDbContext db, ILogger<ClerkWebhookService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<bool> HandleWebhookAsync(string payload, IHeaderDictionary headers, CancellationToken ct = default)
    {
        try
        {
            var webhookEvent = JsonSerializer.Deserialize<ClerkWebhookEvent>(payload);
            if (webhookEvent == null || string.IsNullOrEmpty(webhookEvent.Type))
            {
                _logger.LogWarning("Invalid Clerk webhook payload received.");
                return false;
            }

            _logger.LogInformation("Processing Clerk webhook event: {EventType}", webhookEvent.Type);

            switch (webhookEvent.Type)
            {
                // User Events
                case "user.created":
                    var userData = JsonSerializer.Deserialize<ClerkUserData>(webhookEvent.Data.GetRawText());
                    if (userData != null) await HandleUserCreatedAsync(userData, ct);
                    break;
                case "user.updated":
                    var userUpdateData = JsonSerializer.Deserialize<ClerkUserData>(webhookEvent.Data.GetRawText());
                    if (userUpdateData != null) await HandleUserUpdatedAsync(userUpdateData, ct);
                    break;
                case "user.deleted":
                    var userDelId = webhookEvent.Data.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
                    if (!string.IsNullOrEmpty(userDelId)) await HandleUserDeletedAsync(userDelId, ct);
                    break;

                // Organization Events
                case "organization.created":
                    var orgData = JsonSerializer.Deserialize<ClerkOrganizationData>(webhookEvent.Data.GetRawText());
                    if (orgData != null) await HandleOrganizationCreatedAsync(orgData, ct);
                    break;
                case "organization.updated":
                    var orgUpdateData = JsonSerializer.Deserialize<ClerkOrganizationData>(webhookEvent.Data.GetRawText());
                    if (orgUpdateData != null) await HandleOrganizationUpdatedAsync(orgUpdateData, ct);
                    break;
                case "organization.deleted":
                    var orgDelId = webhookEvent.Data.TryGetProperty("id", out var orgIdProp) ? orgIdProp.GetString() : null;
                    if (!string.IsNullOrEmpty(orgDelId)) await HandleOrganizationDeletedAsync(orgDelId, ct);
                    break;

                // Organization Membership Events
                case "organizationMembership.created":
                    var membershipData = JsonSerializer.Deserialize<ClerkOrgMembershipData>(webhookEvent.Data.GetRawText());
                    if (membershipData != null) await HandleOrgMembershipCreatedAsync(membershipData, ct);
                    break;
                case "organizationMembership.updated":
                    var membershipUpdateData = JsonSerializer.Deserialize<ClerkOrgMembershipData>(webhookEvent.Data.GetRawText());
                    if (membershipUpdateData != null) await HandleOrgMembershipUpdatedAsync(membershipUpdateData, ct);
                    break;
                case "organizationMembership.deleted":
                    var membershipDelData = JsonSerializer.Deserialize<ClerkOrgMembershipData>(webhookEvent.Data.GetRawText());
                    if (membershipDelData != null) await HandleOrgMembershipDeletedAsync(membershipDelData, ct);
                    break;

                default:
                    _logger.LogInformation("Unhandled Clerk webhook event type: {EventType}", webhookEvent.Type);
                    break;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Clerk webhook event");
            return false;
        }
    }

    #region User Event Handlers

    private async Task HandleUserCreatedAsync(ClerkUserData data, CancellationToken ct)
    {
        var existing = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.ClerkUserId == data.Id, ct);
        if (existing != null)
        {
            _logger.LogInformation("User with Clerk ID {ClerkUserId} already exists. Skipping creation.", data.Id);
            return;
        }

        var email = data.EmailAddresses.FirstOrDefault()?.EmailAddress ?? string.Empty;
        var role = DetermineRole(data);
        var status = (role == UserRole.CANDIDATE || role == UserRole.ADMIN) 
            ? UserStatus.ACTIVE 
            : UserStatus.ONBOARDING;

        var user = new User
        {
            ClerkUserId = data.Id,
            Email = email,
            FirstName = data.FirstName ?? string.Empty,
            LastName = data.LastName ?? string.Empty,
            ProfileImageUrl = data.ImageUrl,
            Role = role,
            Status = status
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created new user {UserId} ({Email}) with role {Role} and status {Status}",
            user.Id, user.Email, user.Role, user.Status);
    }

    private async Task HandleUserUpdatedAsync(ClerkUserData data, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == data.Id, ct);
        if (user == null)
        {
            _logger.LogWarning("User with Clerk ID {ClerkUserId} not found for update. Creating user instead.", data.Id);
            await HandleUserCreatedAsync(data, ct);
            return;
        }

        var email = data.EmailAddresses.FirstOrDefault()?.EmailAddress;
        if (!string.IsNullOrEmpty(email))
        {
            user.Email = email;
        }

        user.FirstName = data.FirstName ?? user.FirstName;
        user.LastName = data.LastName ?? user.LastName;
        if (!string.IsNullOrEmpty(data.ImageUrl))
        {
            user.ProfileImageUrl = data.ImageUrl;
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated user {UserId} ({Email}) from Clerk webhook", user.Id, user.Email);
    }

    private async Task HandleUserDeletedAsync(string clerkUserId, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);
        if (user != null)
        {
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Soft deleted user {UserId} ({Email}) from Clerk webhook", user.Id, user.Email);
        }
    }

    #endregion

    #region Organization Event Handlers

    private async Task HandleOrganizationCreatedAsync(ClerkOrganizationData data, CancellationToken ct)
    {
        var existingCompany = await _db.Companies.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.ClerkOrganizationId == data.Id, ct);

        // Find or create creator user if available
        User? creatorUser = null;
        if (!string.IsNullOrEmpty(data.CreatedBy))
        {
            creatorUser = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == data.CreatedBy, ct);
            if (creatorUser == null)
            {
                creatorUser = new User
                {
                    ClerkUserId = data.CreatedBy,
                    Email = $"{data.CreatedBy}@hirewise.dev",
                    FirstName = "Recruiter",
                    LastName = "",
                    Role = UserRole.RECRUITER,
                    Status = UserStatus.ACTIVE,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Users.Add(creatorUser);
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Auto-created creator user {UserId} from Org creation event", creatorUser.Id);
            }
        }

        Company company;
        if (existingCompany != null)
        {
            company = existingCompany;
            company.Name = data.Name;
            company.Slug = data.Slug ?? data.Name.ToLower().Replace(" ", "-");
            if (!string.IsNullOrEmpty(data.LogoUrl ?? data.ImageUrl))
            {
                company.LogoUrl = data.LogoUrl ?? data.ImageUrl;
            }
            if (creatorUser != null)
            {
                company.CreatedByUserId = creatorUser.Id;
            }
            company.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("Updated existing Company {CompanyId} ('{CompanyName}') from Clerk Org {OrgId}",
                company.Id, company.Name, company.ClerkOrganizationId);
        }
        else
        {
            company = new Company
            {
                ClerkOrganizationId = data.Id,
                Name = data.Name,
                Slug = data.Slug ?? data.Name.ToLower().Replace(" ", "-"),
                LogoUrl = data.LogoUrl ?? data.ImageUrl,
                CreatedByUserId = creatorUser?.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Companies.Add(company);
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Auto-created Company {CompanyId} ('{CompanyName}') from Clerk Org {OrgId}",
                company.Id, company.Name, company.ClerkOrganizationId);
        }

        // Link creator to Company with RECRUITER role and ACTIVE status
        if (creatorUser != null)
        {
            creatorUser.CompanyId = company.Id;
            creatorUser.Role = UserRole.RECRUITER;
            creatorUser.Status = UserStatus.ACTIVE;
            creatorUser.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Assigned creator user {UserId} to Company {CompanyId} and set status to ACTIVE with role RECRUITER",
                creatorUser.Id, company.Id);
        }
    }

    private async Task HandleOrganizationUpdatedAsync(ClerkOrganizationData data, CancellationToken ct)
    {
        var company = await _db.Companies.FirstOrDefaultAsync(c => c.ClerkOrganizationId == data.Id, ct);
        if (company == null)
        {
            _logger.LogWarning("Company for Clerk Org {OrgId} not found for update. Creating instead.", data.Id);
            await HandleOrganizationCreatedAsync(data, ct);
            return;
        }

        company.Name = data.Name;
        if (!string.IsNullOrEmpty(data.Slug)) company.Slug = data.Slug;
        if (!string.IsNullOrEmpty(data.LogoUrl ?? data.ImageUrl)) company.LogoUrl = data.LogoUrl ?? data.ImageUrl;
        company.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated Company {CompanyId} from Clerk Org {OrgId}", company.Id, data.Id);
    }

    private async Task HandleOrganizationDeletedAsync(string clerkOrgId, CancellationToken ct)
    {
        var company = await _db.Companies.FirstOrDefaultAsync(c => c.ClerkOrganizationId == clerkOrgId, ct);
        if (company != null)
        {
            company.IsDeleted = true;
            company.DeletedAt = DateTime.UtcNow;

            // Unassign all users linked to this company
            var employees = await _db.Users.Where(u => u.CompanyId == company.Id).ToListAsync(ct);
            foreach (var employee in employees)
            {
                employee.CompanyId = null;
                employee.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Soft deleted Company {CompanyId} ({CompanyName}) from Clerk Org {OrgId}",
                company.Id, company.Name, clerkOrgId);
        }
    }

    #endregion

    #region Organization Membership Event Handlers

    private async Task HandleOrgMembershipCreatedAsync(ClerkOrgMembershipData data, CancellationToken ct)
    {
        var orgId = data.Organization?.Id;
        var clerkUserId = data.PublicUserData?.UserId;

        if (string.IsNullOrEmpty(orgId) || string.IsNullOrEmpty(clerkUserId))
        {
            _logger.LogWarning("Incomplete membership data: OrgId={OrgId}, ClerkUserId={ClerkUserId}", orgId, clerkUserId);
            return;
        }

        var company = await _db.Companies.FirstOrDefaultAsync(c => c.ClerkOrganizationId == orgId, ct);
        if (company == null)
        {
            // If membership arrives before organization.created, pre-create the company record
            company = new Company
            {
                ClerkOrganizationId = orgId,
                Name = data.Organization?.Name ?? "Company Workspace",
                Slug = data.Organization?.Slug ?? orgId.ToLower(),
                LogoUrl = data.Organization?.LogoUrl ?? data.Organization?.ImageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Companies.Add(company);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Pre-created Company {CompanyId} from membership event for Org {OrgId}",
                company.Id, orgId);
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);
        var assignedRole = data.Role == "org:admin" ? UserRole.RECRUITER : UserRole.INTERVIEWER;

        if (user == null)
        {
            var email = data.PublicUserData?.Identifier ?? $"{clerkUserId}@hirewise.dev";
            user = new User
            {
                ClerkUserId = clerkUserId,
                Email = email,
                FirstName = data.PublicUserData?.FirstName ?? string.Empty,
                LastName = data.PublicUserData?.LastName ?? string.Empty,
                ProfileImageUrl = data.PublicUserData?.ProfileImageUrl ?? data.PublicUserData?.ImageUrl,
                Role = assignedRole,
                Status = UserStatus.ACTIVE,
                CompanyId = company.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
        }
        else
        {
            user.CompanyId = company.Id;
            user.Role = assignedRole;
            user.Status = UserStatus.ACTIVE;
            user.UpdatedAt = DateTime.UtcNow;
            if (data.PublicUserData != null)
            {
                if (!string.IsNullOrEmpty(data.PublicUserData.FirstName) && string.IsNullOrEmpty(user.FirstName))
                    user.FirstName = data.PublicUserData.FirstName;
                if (!string.IsNullOrEmpty(data.PublicUserData.LastName) && string.IsNullOrEmpty(user.LastName))
                    user.LastName = data.PublicUserData.LastName;
                if (!string.IsNullOrEmpty(data.PublicUserData.ProfileImageUrl ?? data.PublicUserData.ImageUrl))
                    user.ProfileImageUrl = data.PublicUserData.ProfileImageUrl ?? data.PublicUserData.ImageUrl;
            }
        }

        if (assignedRole == UserRole.RECRUITER && company.CreatedByUserId == null)
        {
            company.CreatedByUserId = user.Id;
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Assigned User {UserId} ({Email}) to Company {CompanyId} as {Role}",
            user.Id, user.Email, company.Id, user.Role);
    }

    private async Task HandleOrgMembershipUpdatedAsync(ClerkOrgMembershipData data, CancellationToken ct)
    {
        var clerkUserId = data.PublicUserData?.UserId;
        if (string.IsNullOrEmpty(clerkUserId)) return;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);
        if (user != null)
        {
            user.Role = data.Role == "org:admin" ? UserRole.RECRUITER : UserRole.INTERVIEWER;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Updated role for User {UserId} to {Role} from membership update", user.Id, user.Role);
        }
    }

    private async Task HandleOrgMembershipDeletedAsync(ClerkOrgMembershipData data, CancellationToken ct)
    {
        var clerkUserId = data.PublicUserData?.UserId;
        if (string.IsNullOrEmpty(clerkUserId)) return;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);
        if (user != null)
        {
            user.CompanyId = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Removed User {UserId} from Company after membership deletion", user.Id);
        }
    }

    #endregion

    private static UserRole DetermineRole(ClerkUserData data)
    {
        string? roleStr = null;

        if (data.PublicMetadata?.TryGetValue("role", out var publicRole) == true && publicRole != null)
        {
            roleStr = publicRole.ToString();
        }
        else if (data.UnsafeMetadata?.TryGetValue("role", out var unsafeRole) == true && unsafeRole != null)
        {
            roleStr = unsafeRole.ToString();
        }

        if (!string.IsNullOrEmpty(roleStr) && Enum.TryParse<UserRole>(roleStr, true, out var parsedRole))
        {
            return parsedRole;
        }

        return UserRole.CANDIDATE;
    }
}
