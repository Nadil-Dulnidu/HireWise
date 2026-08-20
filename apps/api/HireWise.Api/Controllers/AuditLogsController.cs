using HireWise.Api.DTOs.AuditLogs;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Policy = "AdminOnly")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// List audit logs with pagination and comprehensive filtering.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogFilterDto filter, CancellationToken ct)
    {
        var result = await _auditLogService.GetAuditLogsAsync(filter, ct);
        return Ok(ApiResponse<PagedResult<AuditLogDto>>.Ok(result));
    }

    /// <summary>
    /// Get details of a specific audit log by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AuditLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditLogById(Guid id, CancellationToken ct)
    {
        var result = await _auditLogService.GetAuditLogByIdAsync(id, ct);
        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.Error ?? "Audit log not found."));
        }

        return Ok(ApiResponse<AuditLogDto>.Ok(result.Value!));
    }

    /// <summary>
    /// Get distinct filter metadata (actions and entity types) for audit log filtering.
    /// </summary>
    [HttpGet("metadata")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMetadata(CancellationToken ct)
    {
        var entityTypes = await _auditLogService.GetDistinctEntityTypesAsync(ct);
        var actions = await _auditLogService.GetDistinctActionsAsync(ct);

        return Ok(ApiResponse<object>.Ok(new
        {
            EntityTypes = entityTypes.Value ?? new List<string>(),
            Actions = actions.Value ?? new List<string>()
        }));
    }
}
