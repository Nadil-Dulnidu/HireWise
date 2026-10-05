using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.PlatformSettings;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/platform-settings")]
[Authorize(Roles = "ADMIN")]
public class PlatformSettingsController : ControllerBase
{
    private readonly IPlatformSettingsService _settingsService;

    public PlatformSettingsController(IPlatformSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _settingsService.GetAllAsync(ct);
        return Ok(ApiResponse<List<PlatformSettingDto>>.Ok(result.Value!));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateBulk([FromBody] UpdatePlatformSettingsRequest request, CancellationToken ct)
    {
        if (request.Settings == null || request.Settings.Count == 0)
        {
            return BadRequest(ApiResponse<object>.Fail("No settings provided for update."));
        }

        var result = await _settingsService.UpdateBulkAsync(request.Settings, ct);
        return Ok(ApiResponse<List<PlatformSettingDto>>.Ok(result.Value!, "Platform settings updated successfully"));
    }
}
