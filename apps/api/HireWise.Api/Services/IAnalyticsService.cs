using HireWise.Api.DTOs.Analytics;
using HireWise.Api.DTOs.Common;

namespace HireWise.Api.Services;

public interface IAnalyticsService
{
    Task<Result<PlatformStatsDto>> GetPlatformStatsAsync(CancellationToken ct = default);
}
