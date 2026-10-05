using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Departments;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api")]
// Handles API requests related to departments
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;
    private readonly ICurrentUserService _currentUserService;

    public DepartmentsController(IDepartmentService departmentService, ICurrentUserService currentUserService)
    {
        _departmentService = departmentService;
        _currentUserService = currentUserService;
    }

    [HttpGet("companies/{companyId:guid}/departments")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    // Get all departments belonging to a company
    public async Task<IActionResult> GetDepartmentsByCompany(Guid companyId, CancellationToken ct)
    {
        if (!_currentUserService.IsAdmin && _currentUserService.CompanyId.HasValue && _currentUserService.CompanyId != companyId)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You do not have access to departments for this company."));
        }

        var departments = await _departmentService.GetDepartmentsByCompanyAsync(companyId, ct);
        return Ok(ApiResponse<List<DepartmentDto>>.Ok(departments));
    }

    [HttpPost("companies/{companyId:guid}/departments")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Create a new department within a company
    public async Task<IActionResult> CreateDepartment(Guid companyId, [FromBody] CreateDepartmentRequest request, CancellationToken ct)
    {
        if (!_currentUserService.IsAdmin && _currentUserService.CompanyId.HasValue && _currentUserService.CompanyId != companyId)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You do not have access to create departments for another company."));
        }

        var result = await _departmentService.CreateDepartmentAsync(companyId, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to create department"));
        }

        return StatusCode(201, ApiResponse<DepartmentDto>.Ok(result.Value!, "Department created successfully"));
    }

    [HttpGet("departments/{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    // Get a specific department by its ID
    public async Task<IActionResult> GetDepartmentById(Guid id, CancellationToken ct)
    {
        var result = await _departmentService.GetDepartmentByIdAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Department not found"));
        }

        if (!_currentUserService.IsAdmin && _currentUserService.CompanyId.HasValue && result.Value!.CompanyId != _currentUserService.CompanyId)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You do not have access to this department."));
        }

        return Ok(ApiResponse<DepartmentDto>.Ok(result.Value!));
    }

    [HttpPut("departments/{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Update an existing department
    public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentRequest request, CancellationToken ct)
    {
        var deptResult = await _departmentService.GetDepartmentByIdAsync(id, ct);
        if (!deptResult.IsSuccess)
        {
            return StatusCode(deptResult.StatusCode, ApiResponse<object>.Fail(deptResult.Error ?? "Department not found"));
        }

        if (!_currentUserService.IsAdmin && _currentUserService.CompanyId.HasValue && deptResult.Value!.CompanyId != _currentUserService.CompanyId)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You do not have access to update departments for another company."));
        }

        var result = await _departmentService.UpdateDepartmentAsync(id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update department"));
        }

        return Ok(ApiResponse<DepartmentDto>.Ok(result.Value!, "Department updated successfully"));
    }

    [HttpDelete("departments/{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    // Delete a department
    public async Task<IActionResult> DeleteDepartment(Guid id, CancellationToken ct)
    {
        var deptResult = await _departmentService.GetDepartmentByIdAsync(id, ct);
        if (!deptResult.IsSuccess)
        {
            return StatusCode(deptResult.StatusCode, ApiResponse<object>.Fail(deptResult.Error ?? "Department not found"));
        }

        if (!_currentUserService.IsAdmin && _currentUserService.CompanyId.HasValue && deptResult.Value!.CompanyId != _currentUserService.CompanyId)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You do not have access to delete departments for another company."));
        }

        var result = await _departmentService.DeleteDepartmentAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to delete department"));
        }

        return Ok(ApiResponse<object>.Ok(new { deleted = true }, "Department deleted successfully"));
    }
}
