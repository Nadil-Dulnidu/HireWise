using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Companies;
using HireWise.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface ICompanyService
{
    Task<PagedResult<CompanyDto>> GetCompaniesAsync(CompanyFilterRequest request, CancellationToken ct = default);
    Task<Result<CompanyDto>> GetCompanyByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<CompanyDto>> GetCompanyByClerkOrgIdAsync(string clerkOrgId, CancellationToken ct = default);
    Task<Result<CompanyDto>> CreateCompanyAsync(CreateCompanyRequest request, Guid? createdByUserId, CancellationToken ct = default);
    Task<Result<CompanyDto>> UpdateCompanyAsync(Guid id, UpdateCompanyRequest request, CancellationToken ct = default);
    Task<Result> DeleteCompanyAsync(Guid id, CancellationToken ct = default);
}

public class CompanyService : ICompanyService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<CompanyService> _logger;

    public CompanyService(ApplicationDbContext db, IMapper mapper, ILogger<CompanyService> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<CompanyDto>> GetCompaniesAsync(CompanyFilterRequest request, CancellationToken ct = default)
    {
        var query = _db.Companies
            .Include(c => c.CreatedByUser)
            .Include(c => c.Employees)
            .Include(c => c.Departments)
            .Include(c => c.Jobs)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(term) ||
                                     (c.Description != null && c.Description.ToLower().Contains(term)) ||
                                     (c.Industry != null && c.Industry.ToLower().Contains(term)) ||
                                     (c.Location != null && c.Location.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(request.Industry))
        {
            query = query.Where(c => c.Industry != null && c.Industry.ToLower() == request.Industry.Trim().ToLower());
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(c => c.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ProjectTo<CompanyDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResult<CompanyDto>(items, totalCount, request.Page, request.PageSize);
    }

    public async Task<Result<CompanyDto>> GetCompanyByIdAsync(Guid id, CancellationToken ct = default)
    {
        var company = await _db.Companies
            .Include(c => c.CreatedByUser)
            .Include(c => c.Employees)
            .Include(c => c.Departments)
            .Include(c => c.Jobs)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (company == null)
        {
            return Result<CompanyDto>.NotFound($"Company with ID {id} not found.");
        }

        return Result<CompanyDto>.Success(_mapper.Map<CompanyDto>(company));
    }

    public async Task<Result<CompanyDto>> GetCompanyByClerkOrgIdAsync(string clerkOrgId, CancellationToken ct = default)
    {
        var company = await _db.Companies
            .Include(c => c.CreatedByUser)
            .Include(c => c.Employees)
            .Include(c => c.Departments)
            .Include(c => c.Jobs)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ClerkOrganizationId == clerkOrgId, ct);

        if (company == null)
        {
            return Result<CompanyDto>.NotFound($"Company for Clerk Organization '{clerkOrgId}' not found.");
        }

        return Result<CompanyDto>.Success(_mapper.Map<CompanyDto>(company));
    }

    public async Task<Result<CompanyDto>> CreateCompanyAsync(CreateCompanyRequest request, Guid? createdByUserId, CancellationToken ct = default)
    {
        // Check for duplicate company name
        var exists = await _db.Companies.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower(), ct);
        if (exists)
        {
            return Result<CompanyDto>.Conflict($"A company with the name '{request.Name}' already exists.");
        }

        var company = _mapper.Map<Company>(request);
        company.ClerkOrganizationId = !string.IsNullOrEmpty(request.ClerkOrganizationId) 
            ? request.ClerkOrganizationId 
            : $"org_{Guid.NewGuid():N}";
        company.Slug = !string.IsNullOrEmpty(request.Slug) 
            ? request.Slug 
            : request.Name.ToLower().Replace(" ", "-");
        company.CreatedByUserId = createdByUserId;
        company.CreatedAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        _db.Companies.Add(company);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created company '{CompanyName}' (ID: {CompanyId}, ClerkOrg: {ClerkOrgId})",
            company.Name, company.Id, company.ClerkOrganizationId);

        // If the creating user is a recruiter without a company, auto-assign
        if (createdByUserId.HasValue)
        {
            var user = await _db.Users.FindAsync(new object[] { createdByUserId.Value }, ct);
            if (user != null && !user.CompanyId.HasValue)
            {
                user.CompanyId = company.Id;
                await _db.SaveChangesAsync(ct);
            }
        }

        return Result<CompanyDto>.Success(_mapper.Map<CompanyDto>(company), 201);
    }

    public async Task<Result<CompanyDto>> UpdateCompanyAsync(Guid id, UpdateCompanyRequest request, CancellationToken ct = default)
    {
        var company = await _db.Companies.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (company == null)
        {
            return Result<CompanyDto>.NotFound($"Company with ID {id} not found.");
        }

        // Check name uniqueness if changed
        if (!string.Equals(company.Name, request.Name.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var nameConflict = await _db.Companies.AnyAsync(c => c.Id != id && c.Name.ToLower() == request.Name.Trim().ToLower(), ct);
            if (nameConflict)
            {
                return Result<CompanyDto>.Conflict($"A company with the name '{request.Name}' already exists.");
            }
        }

        _mapper.Map(request, company);
        if (!string.IsNullOrEmpty(request.Slug)) company.Slug = request.Slug;
        company.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated company '{CompanyName}' (ID: {CompanyId})", company.Name, company.Id);

        return Result<CompanyDto>.Success(_mapper.Map<CompanyDto>(company));
    }

    public async Task<Result> DeleteCompanyAsync(Guid id, CancellationToken ct = default)
    {
        var company = await _db.Companies.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (company == null)
        {
            return Result.NotFound($"Company with ID {id} not found.");
        }

        company.IsDeleted = true;
        company.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Soft deleted company '{CompanyName}' (ID: {CompanyId})", company.Name, company.Id);

        return Result.Success();
    }
}
