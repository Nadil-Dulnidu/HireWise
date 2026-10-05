using HireWise.Api.DTOs.Analytics;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("platform-stats")]
    public async Task<IActionResult> GetPlatformStats(CancellationToken ct)
    {
        var result = await _analyticsService.GetPlatformStatsAsync(ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to fetch platform stats"));
        }

        return Ok(ApiResponse<PlatformStatsDto>.Ok(result.Value!));
    }
}
