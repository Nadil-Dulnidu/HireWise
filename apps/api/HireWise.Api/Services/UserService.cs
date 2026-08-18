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
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);

        if (user == null)
        {
            var email = _currentUserService.Email;

            // Check if there is an existing user by email
            if (!string.IsNullOrEmpty(email))
            {
                user = await _db.Users
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Email == email, ct);

                if (user != null)
                {
                    user.ClerkUserId = clerkUserId;
                    user.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync(ct);
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

            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Auto-provisioned user {UserId} ({Email}) with role {Role} and status {Status}",
                user.Id, user.Email, user.Role, user.Status);
        }

        // Self-healing org sync: If user has Clerk Org claim but no linked Company in DB, link immediately
        if (!user.CompanyId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkOrganizationId))
        {
            var company = await _db.Companies.FirstOrDefaultAsync(c => c.ClerkOrganizationId == _currentUserService.ClerkOrganizationId, ct);
            if (company != null)
            {
                user.CompanyId = company.Id;
                user.Company = company;
                if (user.Role == UserRole.CANDIDATE || user.Role == UserRole.RECRUITER)
                {
                    user.Role = _currentUserService.Role ?? UserRole.RECRUITER;
                }
                user.Status = UserStatus.ACTIVE;
                user.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Self-healed user {UserId} linking to Company {CompanyId} via Clerk Org {OrgId}",
                    user.Id, company.Id, _currentUserService.ClerkOrganizationId);
            }
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
