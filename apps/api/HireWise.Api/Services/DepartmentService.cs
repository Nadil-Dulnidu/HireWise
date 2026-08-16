using AutoMapper;
using AutoMapper.QueryableExtensions;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Departments;
using HireWise.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetDepartmentsByCompanyAsync(Guid companyId, CancellationToken ct = default);
    Task<Result<DepartmentDto>> GetDepartmentByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<DepartmentDto>> CreateDepartmentAsync(Guid companyId, CreateDepartmentRequest request, CancellationToken ct = default);
    Task<Result<DepartmentDto>> UpdateDepartmentAsync(Guid id, UpdateDepartmentRequest request, CancellationToken ct = default);
    Task<Result> DeleteDepartmentAsync(Guid id, CancellationToken ct = default);
}

public class DepartmentService : IDepartmentService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly ILogger<DepartmentService> _logger;

    public DepartmentService(ApplicationDbContext db, IMapper mapper, ILogger<DepartmentService> logger)
    {
        _db = db;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsByCompanyAsync(Guid companyId, CancellationToken ct = default)
    {
        return await _db.Departments
            .Include(d => d.Company)
            .Include(d => d.Jobs)
            .AsNoTracking()
            .Where(d => d.CompanyId == companyId)
            .OrderBy(d => d.Name)
            .ProjectTo<DepartmentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<Result<DepartmentDto>> GetDepartmentByIdAsync(Guid id, CancellationToken ct = default)
    {
        var department = await _db.Departments
            .Include(d => d.Company)
            .Include(d => d.Jobs)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (department == null)
        {
            return Result<DepartmentDto>.NotFound($"Department with ID {id} not found.");
        }

        return Result<DepartmentDto>.Success(_mapper.Map<DepartmentDto>(department));
    }

    public async Task<Result<DepartmentDto>> CreateDepartmentAsync(Guid companyId, CreateDepartmentRequest request, CancellationToken ct = default)
    {
        var companyExists = await _db.Companies.AnyAsync(c => c.Id == companyId, ct);
        if (!companyExists)
        {
            return Result<DepartmentDto>.NotFound($"Company with ID {companyId} not found.");
        }

        var exists = await _db.Departments.AnyAsync(d => d.CompanyId == companyId && d.Name.ToLower() == request.Name.Trim().ToLower(), ct);
        if (exists)
        {
            return Result<DepartmentDto>.Conflict($"Department '{request.Name}' already exists in this company.");
        }

        var department = _mapper.Map<Department>(request);
        department.CompanyId = companyId;
        department.CreatedAt = DateTime.UtcNow;
        department.UpdatedAt = DateTime.UtcNow;

        _db.Departments.Add(department);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created department '{DepartmentName}' in company {CompanyId}", department.Name, companyId);

        return Result<DepartmentDto>.Success(_mapper.Map<DepartmentDto>(department), 201);
    }

    public async Task<Result<DepartmentDto>> UpdateDepartmentAsync(Guid id, UpdateDepartmentRequest request, CancellationToken ct = default)
    {
        var department = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (department == null)
        {
            return Result<DepartmentDto>.NotFound($"Department with ID {id} not found.");
        }

        if (!string.Equals(department.Name, request.Name.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var conflict = await _db.Departments.AnyAsync(d => d.CompanyId == department.CompanyId && d.Id != id && d.Name.ToLower() == request.Name.Trim().ToLower(), ct);
            if (conflict)
            {
                return Result<DepartmentDto>.Conflict($"Department '{request.Name}' already exists in this company.");
            }
        }

        _mapper.Map(request, department);
        department.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated department '{DepartmentName}' (ID: {DepartmentId})", department.Name, department.Id);

        return Result<DepartmentDto>.Success(_mapper.Map<DepartmentDto>(department));
    }

    public async Task<Result> DeleteDepartmentAsync(Guid id, CancellationToken ct = default)
    {
        var department = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (department == null)
        {
            return Result.NotFound($"Department with ID {id} not found.");
        }

        department.IsDeleted = true;
        department.DeletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Soft deleted department '{DepartmentName}' (ID: {DepartmentId})", department.Name, department.Id);

        return Result.Success();
    }
}
