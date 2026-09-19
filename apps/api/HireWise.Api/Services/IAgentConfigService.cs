using HireWise.Api.DTOs.AgentConfig;
using HireWise.Api.DTOs.Common;

namespace HireWise.Api.Services;

public interface IAgentConfigService
{
    Task<Result<List<AgentConfigDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<AgentConfigDto>> GetByKeyAsync(string agentKey, CancellationToken ct = default);
    Task<Result<AgentConfigDto>> UpdateAsync(Guid id, UpdateAgentConfigRequest request, CancellationToken ct = default);
    Task<Result<List<AgentConfigDto>>> ResetToDefaultsAsync(CancellationToken ct = default);
    Task EnsureSeededAsync(CancellationToken ct = default);
}
