using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Users;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IUserService
{
    Task<Result<UserDto>> GetCurrentUserAsync(string clerkUserId, CancellationToken ct = default);
    Task<Result<UserDto>> GetUserByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<UserDto>> GetUsersAsync(UserFilterRequest request, CancellationToken ct = default);
    Task<Result<UserDto>> UpdateProfileAsync(string clerkUserId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<Result<UserDto>> UpdateRoleAsync(Guid id, UserRole newRole, CancellationToken ct = default);
    Task<Result<UserDto>> SetSelfRoleAsync(string clerkUserId, UserRole newRole, CancellationToken ct = default);
    Task<Result<bool>> DeactivateUserAsync(Guid id, CancellationToken ct = default);
    Task<Result<bool>> BanUserAsync(Guid id, string? reason, CancellationToken ct = default);
    Task<Result<List<UserDto>>> GetInterviewersByCompanyAsync(Guid companyId, CancellationToken ct = default);
    Task<Result<List<TeamMemberDto>>> GetTeamMembersAsync(Guid companyId, CancellationToken ct = default);
}

public class UserService : IUserService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<UserService> _logger;

    public UserService(ApplicationDbContext db, IMapper mapper, ICurrentUserService currentUserService, ILogger<UserService> logger)
    {
        _db = db;
        _mapper = mapper;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<Result<UserDto>> GetCurrentUserAsync(string clerkUserId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);

        if (user != null && user.IsDeleted)
        {
            user.IsDeleted = false;
            user.DeletedAt = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Reactivated soft-deleted user {UserId} ({Email}) for Clerk ID {ClerkUserId}",
                user.Id, user.Email, clerkUserId);
        }

        if (user == null)
        {
            var email = _currentUserService.Email;

            // Check if there is an existing user by email (including previously soft-deleted ones)
            if (!string.IsNullOrEmpty(email))
            {
                user = await _db.Users
                    .IgnoreQueryFilters()
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), ct);

                if (user != null)
                {
                    user.ClerkUserId = clerkUserId;
                    user.IsDeleted = false;
                    user.DeletedAt = null;
                    user.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync(ct);
                    _logger.LogInformation("Linked and restored existing user {UserId} ({Email}) to new Clerk ID {ClerkUserId}",
                        user.Id, user.Email, clerkUserId);
                    return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
                }
            }

            // Auto-provision new user from authenticated claims
            var role = _currentUserService.Role ?? UserRole.CANDIDATE;
            var status = (role == UserRole.CANDIDATE || role == UserRole.ADMIN) 
                ? UserStatus.ACTIVE 
                : UserStatus.ONBOARDING;

            user = new User
            {
                ClerkUserId = clerkUserId,
                Email = !string.IsNullOrEmpty(email) ? email : $"{clerkUserId}@hirewise.dev",
                FirstName = _currentUserService.FirstName ?? "User",
                LastName = _currentUserService.LastName ?? "",
                Role = role,
                Status = status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                _db.Users.Add(user);
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Auto-provisioned user {UserId} ({Email}) with role {Role} and status {Status}",
                    user.Id, user.Email, user.Role, user.Status);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict during auto-provisioning for {ClerkUserId}. Reloading existing user.", clerkUserId);
                _db.ChangeTracker.Clear();
                user = await _db.Users
                    .IgnoreQueryFilters()
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId || (!string.IsNullOrEmpty(email) && u.Email.ToLower() == email.ToLower()), ct);

                if (user != null)
                {
                    if (user.IsDeleted)
                    {
                        user.IsDeleted = false;
                        user.DeletedAt = null;
                    }
                    user.ClerkUserId = clerkUserId;
                    user.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync(ct);
                }
                else
                {
                    throw;
                }
            }
        }

        var explicitRole = _currentUserService.Role;

        // If the user's role is CANDIDATE (either explicitly requested or set on the user):
        // Ensure they are preserved as CANDIDATE and not forcibly attached to any company.
        if (explicitRole == UserRole.CANDIDATE || (user.Role == UserRole.CANDIDATE && explicitRole != UserRole.RECRUITER && explicitRole != UserRole.INTERVIEWER))
        {
            if (user.Role != UserRole.CANDIDATE || user.CompanyId != null)
            {
                user.Role = UserRole.CANDIDATE;
                user.CompanyId = null;
                user.Company = null;
                user.Status = UserStatus.ACTIVE;
                user.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Preserved/reset user {UserId} ({Email}) as CANDIDATE", user.Id, user.Email);
            }
            return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
        }

        // Self-healing org & role sync: Link company and correct role if user belongs to an org or created one
        var orgId = _currentUserService.ClerkOrganizationId;
        Company? company = null;

        if (!string.IsNullOrEmpty(orgId))
        {
            company = await _db.Companies.FirstOrDefaultAsync(c => c.ClerkOrganizationId == orgId, ct);
        }

        if (company == null && !user.CompanyId.HasValue && explicitRole != UserRole.CANDIDATE && user.Role != UserRole.CANDIDATE)
        {
            // Check if this user created any company in the DB
            company = await _db.Companies.FirstOrDefaultAsync(c => c.CreatedByUserId == user.Id, ct);
        }

        if (company != null)
        {
            var targetRole = explicitRole ?? user.Role;

            // If the user created this company or is org admin, they are definitely a RECRUITER
            if (company.CreatedByUserId == user.Id || _currentUserService.OrgRole == "org:admin" || explicitRole == UserRole.RECRUITER)
            {
                targetRole = UserRole.RECRUITER;
            }
            else if (_currentUserService.OrgRole == "org:member" || explicitRole == UserRole.INTERVIEWER)
            {
                targetRole = UserRole.INTERVIEWER;
            }

            var shouldUpdate = user.CompanyId != company.Id || user.Role != targetRole || user.Status != UserStatus.ACTIVE || company.CreatedByUserId == null;

            if (shouldUpdate)
            {
                user.CompanyId = company.Id;
                user.Company = company;
                user.Role = targetRole;
                user.Status = UserStatus.ACTIVE;
                user.UpdatedAt = DateTime.UtcNow;

                if (company.CreatedByUserId == null && targetRole == UserRole.RECRUITER)
                {
                    company.CreatedByUserId = user.Id;
                    company.UpdatedAt = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Self-healed user {UserId}: Linked to Company {CompanyId} with Role {Role} and Status {Status}",
                    user.Id, company.Id, user.Role, user.Status);
            }
        }
        else if (_currentUserService.Role.HasValue && _currentUserService.Role.Value != user.Role)
        {
            user.Role = _currentUserService.Role.Value;
            if (user.Role == UserRole.CANDIDATE || user.Role == UserRole.ADMIN)
            {
                user.Status = UserStatus.ACTIVE;
            }
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Self-healed user {UserId} role to {Role}", user.Id, user.Role);
        }

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<UserDto>.NotFound($"User with ID {id} not found.");
        }

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(UserFilterRequest request, CancellationToken ct = default)
    {
        var query = _db.Users
            .Include(u => u.Company)
            .AsNoTracking();

        if (request.Role.HasValue)
        {
            query = query.Where(u => u.Role == request.Role.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(u => u.Status == request.Status.Value);
        }

        if (request.CompanyId.HasValue)
        {
            query = query.Where(u => u.CompanyId == request.CompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(search) ||
                u.LastName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(ct);

        query = request.SortDescending
            ? query.OrderByDescending(u => u.CreatedAt)
            : query.OrderBy(u => u.CreatedAt);

        var users = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<UserDto>(users, totalCount, request.Page, request.PageSize);
    }

    public async Task<Result<UserDto>> UpdateProfileAsync(string clerkUserId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);

        if (user == null)
        {
            return Result<UserDto>.NotFound("User not found.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Phone = request.Phone;
        if (!string.IsNullOrEmpty(request.ProfileImageUrl))
        {
            user.ProfileImageUrl = request.ProfileImageUrl;
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Profile updated for user {UserId} ({Email})", user.Id, user.Email);

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    public async Task<Result<UserDto>> UpdateRoleAsync(Guid id, UserRole newRole, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

        if (user == null)
        {
            return Result<UserDto>.NotFound("User not found.");
        }

        user.Role = newRole;
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Role updated to {Role} for user {UserId}", newRole, user.Id);

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    public async Task<Result<UserDto>> SetSelfRoleAsync(string clerkUserId, UserRole newRole, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);

        if (user == null)
        {
            return Result<UserDto>.NotFound("User not found.");
        }

        user.Role = newRole;
        if (newRole == UserRole.CANDIDATE)
        {
            user.Status = UserStatus.ACTIVE;
            user.CompanyId = null;
            user.Company = null;
        }
        else if (newRole == UserRole.RECRUITER)
        {
            user.Status = user.CompanyId.HasValue ? UserStatus.ACTIVE : UserStatus.ONBOARDING;
        }
        else if (newRole == UserRole.INTERVIEWER || newRole == UserRole.ADMIN)
        {
            user.Status = UserStatus.ACTIVE;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Self-updated role to {Role} for user {UserId} ({Email})", newRole, user.Id, user.Email);

        return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
    }

    public async Task<Result<bool>> DeactivateUserAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null)
        {
            return Result<bool>.NotFound("User not found.");
        }

        user.Status = UserStatus.INACTIVE;
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("User {UserId} deactivated", user.Id);

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> BanUserAsync(Guid id, string? reason, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null)
        {
            return Result<bool>.NotFound("User not found.");
        }

        user.Status = UserStatus.INACTIVE;
        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogWarning("User {UserId} was banned by admin. Reason: {Reason}", user.Id, reason ?? "No reason provided");

        return Result<bool>.Success(true);
    }

    public async Task<Result<List<UserDto>>> GetInterviewersByCompanyAsync(Guid companyId, CancellationToken ct = default)
    {
        var interviewers = await _db.Users
            .Where(u => u.CompanyId == companyId && u.Role == UserRole.INTERVIEWER && u.Status == UserStatus.ACTIVE)
            .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return Result<List<UserDto>>.Success(interviewers);
    }

    public async Task<Result<List<TeamMemberDto>>> GetTeamMembersAsync(Guid companyId, CancellationToken ct = default)
    {
        var members = await _db.Users
            .Where(u => u.CompanyId == companyId)
            .Select(u => new TeamMemberDto
            {
                Id = u.Id,
                ClerkUserId = u.ClerkUserId,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                Status = u.Status,
                ProfileImageUrl = u.ProfileImageUrl,
                AssignedInterviewsCount = u.AssignedInterviews.Count(i => !i.IsDeleted),
                CompletedFeedbacksCount = u.SubmittedFeedbacks.Count(),
                CreatedAt = u.CreatedAt
            })
            .OrderBy(u => u.Role == UserRole.RECRUITER ? 0 : 1)
            .ThenBy(u => u.FirstName)
            .ToListAsync(ct);

        return Result<List<TeamMemberDto>>.Success(members);
    }
}
