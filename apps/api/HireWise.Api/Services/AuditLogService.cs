using HireWise.Api.Data;
using HireWise.Api.DTOs.AuditLogs;
using HireWise.Api.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IAuditLogService
{
    Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogFilterDto filter, CancellationToken ct = default);
    Task<Result<AuditLogDto>> GetAuditLogByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<List<string>>> GetDistinctEntityTypesAsync(CancellationToken ct = default);
    Task<Result<List<string>>> GetDistinctActionsAsync(CancellationToken ct = default);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(ApplicationDbContext db, ILogger<AuditLogService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogFilterDto filter, CancellationToken ct = default)
    {
        var query = from log in _db.AuditLogs.AsNoTracking()
                    join user in _db.Users.AsNoTracking() on log.UserId equals user.Id into userGroup
                    from u in userGroup.DefaultIfEmpty()
                    select new AuditLogDto
                    {
                        Id = log.Id,
                        UserId = log.UserId,
                        UserEmail = u != null ? u.Email : null,
                        UserName = u != null ? $"{u.FirstName} {u.LastName}".Trim() : null,
                        Role = log.Role,
                        Action = log.Action,
                        EntityType = log.EntityType,
                        EntityId = log.EntityId,
                        OldValuesJson = log.OldValuesJson,
                        NewValuesJson = log.NewValuesJson,
                        IpAddress = log.IpAddress,
                        CorrelationId = log.CorrelationId,
                        CreatedAt = log.CreatedAt
                    };

        // Filter by Action
        if (!string.IsNullOrWhiteSpace(filter.Action))
        {
            var actionNormalized = filter.Action.Trim().ToUpperInvariant();
            query = query.Where(l => l.Action.ToUpper() == actionNormalized);
        }

        // Filter by EntityType
        if (!string.IsNullOrWhiteSpace(filter.EntityType))
        {
            var entityTypeNormalized = filter.EntityType.Trim().ToLowerInvariant();
            query = query.Where(l => l.EntityType.ToLower() == entityTypeNormalized);
        }

        // Filter by UserId
        if (filter.UserId.HasValue && filter.UserId.Value != Guid.Empty)
        {
            query = query.Where(l => l.UserId == filter.UserId.Value);
        }

        // Filter by Date Range
        if (filter.FromDate.HasValue)
        {
            var fromUtc = DateTime.SpecifyKind(filter.FromDate.Value, DateTimeKind.Utc);
            query = query.Where(l => l.CreatedAt >= fromUtc);
        }

        if (filter.ToDate.HasValue)
        {
            var toUtc = DateTime.SpecifyKind(filter.ToDate.Value, DateTimeKind.Utc);
            query = query.Where(l => l.CreatedAt <= toUtc);
        }

        // Free-text Search
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(l =>
                l.Action.ToLower().Contains(search) ||
                l.EntityType.ToLower().Contains(search) ||
                (l.UserEmail != null && l.UserEmail.ToLower().Contains(search)) ||
                (l.UserName != null && l.UserName.ToLower().Contains(search)) ||
                (l.IpAddress != null && l.IpAddress.Contains(search)) ||
                (l.CorrelationId != null && l.CorrelationId.Contains(search)));
        }

        var totalCount = await query.CountAsync(ct);

        // Sorting
        query = query.OrderByDescending(l => l.CreatedAt);

        // Pagination
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 20 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>(items, totalCount, page, pageSize);
    }

    public async Task<Result<AuditLogDto>> GetAuditLogByIdAsync(Guid id, CancellationToken ct = default)
    {
        var query = from log in _db.AuditLogs.AsNoTracking().Where(l => l.Id == id)
                    join user in _db.Users.AsNoTracking() on log.UserId equals user.Id into userGroup
                    from u in userGroup.DefaultIfEmpty()
                    select new AuditLogDto
                    {
                        Id = log.Id,
                        UserId = log.UserId,
                        UserEmail = u != null ? u.Email : null,
                        UserName = u != null ? $"{u.FirstName} {u.LastName}".Trim() : null,
                        Role = log.Role,
                        Action = log.Action,
                        EntityType = log.EntityType,
                        EntityId = log.EntityId,
                        OldValuesJson = log.OldValuesJson,
                        NewValuesJson = log.NewValuesJson,
                        IpAddress = log.IpAddress,
                        CorrelationId = log.CorrelationId,
                        CreatedAt = log.CreatedAt
                    };

        var item = await query.FirstOrDefaultAsync(ct);
        if (item == null)
        {
            return Result<AuditLogDto>.NotFound($"Audit log with ID {id} not found.");
        }

        return Result<AuditLogDto>.Success(item);
    }

    public async Task<Result<List<string>>> GetDistinctEntityTypesAsync(CancellationToken ct = default)
    {
        var types = await _db.AuditLogs
            .AsNoTracking()
            .Select(l => l.EntityType)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync(ct);

        return Result<List<string>>.Success(types);
    }

    public async Task<Result<List<string>>> GetDistinctActionsAsync(CancellationToken ct = default)
    {
        var actions = await _db.AuditLogs
            .AsNoTracking()
            .Select(l => l.Action)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync(ct);

        return Result<List<string>>.Success(actions);
    }
}
