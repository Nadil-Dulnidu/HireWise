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
    private readonly IUserService _userService;

    public CompaniesController(
        ICompanyService companyService,
        ICurrentUserService currentUserService,
        IUserService userService)
    {
        _companyService = companyService;
        _currentUserService = currentUserService;
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN,RECRUITER")]
    public async Task<IActionResult> GetCompanies([FromQuery] CompanyFilterRequest request, CancellationToken ct)
    {
        var result = await _companyService.GetCompaniesAsync(request, ct);
        return Ok(ApiResponse<PagedResult<CompanyDto>>.Ok(result));
    }

    [HttpGet("my-company")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetMyCompany(CancellationToken ct)
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkUserId))
        {
            var userResult = await _userService.GetCurrentUserAsync(_currentUserService.ClerkUserId, ct);
            if (userResult.IsSuccess)
            {
                companyId = userResult.Value?.CompanyId;
            }
        }

        if (!companyId.HasValue && !string.IsNullOrEmpty(_currentUserService.ClerkOrganizationId))
        {
            var orgResult = await _companyService.GetCompanyByClerkOrgIdAsync(_currentUserService.ClerkOrganizationId, ct);
            if (orgResult.IsSuccess)
            {
                return Ok(ApiResponse<CompanyDto>.Ok(orgResult.Value!));
            }
        }

        if (!companyId.HasValue)
        {
            return NotFound(ApiResponse<object>.Fail("No associated company or organization found for the current user."));
        }

        var result = await _companyService.GetCompanyByIdAsync(companyId.Value, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Company not found"));
        }

        return Ok(ApiResponse<CompanyDto>.Ok(result.Value!));
    }

    [HttpGet("by-org/{clerkOrgId}")]
    [Authorize(Roles = "ADMIN,RECRUITER,INTERVIEWER")]
    public async Task<IActionResult> GetCompanyByOrg(string clerkOrgId, CancellationToken ct)
    {
        var result = await _companyService.GetCompanyByClerkOrgIdAsync(clerkOrgId, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Company not found for this organization"));
        }

        return Ok(ApiResponse<CompanyDto>.Ok(result.Value!));
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
        if (_currentUserService.IsRecruiter && _currentUserService.CompanyId.HasValue && _currentUserService.CompanyId.Value != id)
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
