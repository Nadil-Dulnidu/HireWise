using HireWise.Api.DTOs.AgentConfig;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/agent-configs")]
[Authorize(Roles = "ADMIN")]
public class AgentConfigController : ControllerBase
{
    private readonly IAgentConfigService _agentConfigService;

    public AgentConfigController(IAgentConfigService agentConfigService)
    {
        _agentConfigService = agentConfigService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _agentConfigService.GetAllAsync(ct);
        return Ok(ApiResponse<List<AgentConfigDto>>.Ok(result.Value!));
    }

    [HttpGet("{agentKey}")]
    public async Task<IActionResult> GetByKey(string agentKey, CancellationToken ct)
    {
        var result = await _agentConfigService.GetByKeyAsync(agentKey, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Agent config not found"));
        }

        return Ok(ApiResponse<AgentConfigDto>.Ok(result.Value!));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAgentConfigRequest request, CancellationToken ct)
    {
        var result = await _agentConfigService.UpdateAsync(id, request, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Failed to update agent config"));
        }

        return Ok(ApiResponse<AgentConfigDto>.Ok(result.Value!, "Agent configuration updated successfully"));
    }

    [HttpPost("reset")]
    public async Task<IActionResult> ResetToDefaults(CancellationToken ct)
    {
        var result = await _agentConfigService.ResetToDefaultsAsync(ct);
        return Ok(ApiResponse<List<AgentConfigDto>>.Ok(result.Value!, "Agent configurations reset to defaults"));
    }
}
