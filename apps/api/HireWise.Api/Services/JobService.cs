using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Jobs;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IJobService
{
    Task<PagedResult<JobSummaryDto>> GetPublicJobsAsync(JobFilterRequest request, CancellationToken ct = default);
    Task<PagedResult<JobDto>> GetJobsAsync(JobFilterRequest request, Guid? scopeCompanyId, bool isAdmin, CancellationToken ct = default);
    Task<Result<JobDto>> GetJobByIdAsync(Guid id, Guid? userCompanyId, bool isStaff, CancellationToken ct = default);
    Task<Result<JobDto>> CreateJobAsync(CreateJobRequest request, Guid createdByUserId, Guid companyId, CancellationToken ct = default);
    Task<Result<JobDto>> UpdateJobAsync(Guid id, UpdateJobRequest request, Guid? userCompanyId, bool isAdmin, CancellationToken ct = default);
    Task<Result<JobDto>> UpdateJobStatusAsync(Guid id, JobStatus newStatus, Guid? userCompanyId, bool isAdmin, CancellationToken ct = default);
    Task<Result> DeleteJobAsync(Guid id, Guid? userCompanyId, bool isAdmin, CancellationToken ct = default);
}

public class JobService : IJobService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<JobService> _logger;

    public JobService(ApplicationDbContext db, IMapper mapper, ILogger<JobService> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<JobSummaryDto>> GetPublicJobsAsync(JobFilterRequest request, CancellationToken ct = default)
    {
        var query = _db.Jobs
            .Include(j => j.Company)
            .Include(j => j.Department)
            .AsNoTracking()
            .Where(j => j.Status == JobStatus.OPEN);

        query = ApplyFilters(query, request);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<JobSummaryDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<JobSummaryDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<PagedResult<JobDto>> GetJobsAsync(JobFilterRequest request, Guid? scopeCompanyId, bool isAdmin, CancellationToken ct = default)
    {
        var query = _db.Jobs
            .Include(j => j.Company)
            .Include(j => j.Department)
            .Include(j => j.CreatedByUser)
            .Include(j => j.Applications)
            .AsNoTracking();

        // Enforce company scoping for non-admin staff
        if (!isAdmin)
        {
            if (!scopeCompanyId.HasValue)
            {
                return new PagedResult<JobDto>(new List<JobDto>(), 0, request.Page, request.PageSize);
            }
            query = query.Where(j => j.CompanyId == scopeCompanyId.Value);
        }
        else if (request.CompanyId.HasValue)
        {
            query = query.Where(j => j.CompanyId == request.CompanyId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(j => j.Status == request.Status.Value);
        }

        query = ApplyFilters(query, request);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<JobDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<JobDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Result<JobDto>> GetJobByIdAsync(Guid id, Guid? userCompanyId, bool isStaff, CancellationToken ct = default)
    {
        var query = _db.Jobs
            .Include(j => j.Company)
            .Include(j => j.Department)
            .Include(j => j.CreatedByUser)
            .Include(j => j.Applications)
            .AsNoTracking();

        var job = await query.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job == null)
        {
            return Result<JobDto>.NotFound($"Job with ID {id} not found.");
        }

        // Access check: Public users can only see OPEN jobs.
        if (!isStaff && job.Status != JobStatus.OPEN)
        {
            return Result<JobDto>.NotFound($"Job with ID {id} not found.");
        }

        // Staff check: Recruiter must belong to the job's company unless Admin
        if (isStaff && userCompanyId.HasValue && job.CompanyId != userCompanyId.Value)
        {
            return Result<JobDto>.Forbidden("You do not have access to view jobs from another company.");
        }

        return Result<JobDto>.Success(_mapper.Map<JobDto>(job));
    }

    public async Task<Result<JobDto>> CreateJobAsync(CreateJobRequest request, Guid createdByUserId, Guid companyId, CancellationToken ct = default)
    {
        var companyExists = await _db.Companies.AnyAsync(c => c.Id == companyId, ct);
        if (!companyExists)
        {
            return Result<JobDto>.NotFound($"Company with ID {companyId} not found.");
        }

        if (request.DepartmentId.HasValue)
        {
            var deptExists = await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId.Value && d.CompanyId == companyId, ct);
            if (!deptExists)
            {
                return Result<JobDto>.NotFound($"Department with ID {request.DepartmentId.Value} does not belong to this company.");
            }
        }

        var job = _mapper.Map<Job>(request);
        job.CompanyId = companyId;
        job.CreatedByUserId = createdByUserId;
        job.CreatedAt = DateTime.UtcNow;
        job.UpdatedAt = DateTime.UtcNow;

        _db.Jobs.Add(job);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Job '{JobTitle}' created (ID: {JobId}) in Company {CompanyId} by User {UserId}",
            job.Title, job.Id, companyId, createdByUserId);

        // Fetch freshly created with relations
        return await GetJobByIdAsync(job.Id, companyId, true, ct);
    }

    public async Task<Result<JobDto>> UpdateJobAsync(Guid id, UpdateJobRequest request, Guid? userCompanyId, bool isAdmin, CancellationToken ct = default)
    {
        var job = await _db.Jobs
            .Include(j => j.Company)
            .Include(j => j.Department)
            .FirstOrDefaultAsync(j => j.Id == id, ct);

        if (job == null)
        {
            return Result<JobDto>.NotFound($"Job with ID {id} not found.");
        }

        if (!isAdmin && userCompanyId.HasValue && job.CompanyId != userCompanyId.Value)
        {
            return Result<JobDto>.Forbidden("You do not have permission to modify jobs for another company.");
        }

        if (request.DepartmentId.HasValue)
        {
            var deptExists = await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId.Value && d.CompanyId == job.CompanyId, ct);
            if (!deptExists)
            {
                return Result<JobDto>.NotFound($"Department with ID {request.DepartmentId.Value} does not belong to this company.");
            }
        }

        _mapper.Map(request, job);
        job.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated job '{JobTitle}' (ID: {JobId})", job.Title, job.Id);

        return await GetJobByIdAsync(job.Id, userCompanyId, true, ct);
    }

    public async Task<Result<JobDto>> UpdateJobStatusAsync(Guid id, JobStatus newStatus, Guid? userCompanyId, bool isAdmin, CancellationToken ct = default)
    {
        var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job == null)
        {
            return Result<JobDto>.NotFound($"Job with ID {id} not found.");
        }

        if (!isAdmin && userCompanyId.HasValue && job.CompanyId != userCompanyId.Value)
        {
            return Result<JobDto>.Forbidden("You do not have permission to modify jobs for another company.");
        }

        // Business rule for status lifecycle:
        // Once CLOSED, a job cannot be reopened (or must be duplicated)
        if (job.Status == JobStatus.CLOSED && newStatus != JobStatus.CLOSED)
        {
            return Result<JobDto>.Failure("Closed jobs cannot be reopened directly. Please create a new job posting.");
        }

        job.Status = newStatus;
        job.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Job '{JobTitle}' (ID: {JobId}) status changed to {Status}", job.Title, job.Id, newStatus);

        return await GetJobByIdAsync(job.Id, userCompanyId, true, ct);
    }

    public async Task<Result> DeleteJobAsync(Guid id, Guid? userCompanyId, bool isAdmin, CancellationToken ct = default)
    {
        var job = await _db.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct);
        if (job == null)
        {
            return Result.NotFound($"Job with ID {id} not found.");
        }

        if (!isAdmin && userCompanyId.HasValue && job.CompanyId != userCompanyId.Value)
        {
            return Result.Forbidden("You do not have permission to delete jobs for another company.");
        }

        job.IsDeleted = true;
        job.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Soft deleted job '{JobTitle}' (ID: {JobId})", job.Title, job.Id);

        return Result.Success();
    }

    private static IQueryable<Job> ApplyFilters(IQueryable<Job> query, JobFilterRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(j => j.Title.ToLower().Contains(term) ||
                                     j.Description.ToLower().Contains(term) ||
                                     j.Requirements.ToLower().Contains(term) ||
                                     j.Location.ToLower().Contains(term) ||
                                     j.Company.Name.ToLower().Contains(term));
        }

        if (request.EmploymentType.HasValue)
        {
            query = query.Where(j => j.EmploymentType == request.EmploymentType.Value);
        }

        if (request.ExperienceLevel.HasValue)
        {
            query = query.Where(j => j.ExperienceLevel == request.ExperienceLevel.Value);
        }

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(j => j.DepartmentId == request.DepartmentId.Value);
        }

        if (request.MinSalary.HasValue)
        {
            query = query.Where(j => j.SalaryMax == null || j.SalaryMax >= request.MinSalary.Value);
        }

        if (request.MaxSalary.HasValue)
        {
            query = query.Where(j => j.SalaryMin == null || j.SalaryMin <= request.MaxSalary.Value);
        }

        return query;
    }
}
