using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.Companies;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ICurrentUserService _currentUserService;

    public CompaniesController(ICompanyService companyService, ICurrentUserService currentUserService)
    {
        _companyService = companyService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetCompanies([FromQuery] CompanyFilterRequest request, CancellationToken ct)
    {
        var result = await _companyService.GetCompaniesAsync(request, ct);
        return Ok(ApiResponse<PagedResult<CompanyDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetCompanyById(Guid id, CancellationToken ct)
    {
        var result = await _companyService.GetCompanyByIdAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Company not found"));
        }

        return Ok(ApiResponse<CompanyDto>.Ok(result.Value!));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request, CancellationToken ct)
    {
        var result = await _companyService.CreateCompanyAsync(request, _currentUserService.UserId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to create company"));
        }

        return CreatedAtAction(nameof(GetCompanyById), new { id = result.Value!.Id }, ApiResponse<CompanyDto>.Ok(result.Value!, "Company created successfully"));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> UpdateCompany(Guid id, [FromBody] UpdateCompanyRequest request, CancellationToken ct)
    {
        if (_currentUserService.IsRecruiter && _currentUserService.CompanyId != id)
        {
            return StatusCode(403, ApiResponse<object>.Fail("You do not have permission to update another company."));
        }

        var result = await _companyService.UpdateCompanyAsync(id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update company"));
        }

        return Ok(ApiResponse<CompanyDto>.Ok(result.Value!, "Company updated successfully"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteCompany(Guid id, CancellationToken ct)
    {
        var result = await _companyService.DeleteCompanyAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to delete company"));
        }

        return Ok(ApiResponse<object>.Ok(new { deleted = true }, "Company deleted successfully"));
    }
}
