using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.PlatformSettings;

namespace HireWise.Api.Services;

public interface IPlatformSettingsService
{
    Task<Result<List<PlatformSettingDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<string>> GetValueAsync(string key, string defaultValue = "", CancellationToken ct = default);
    Task<Result<List<PlatformSettingDto>>> UpdateBulkAsync(Dictionary<string, string> settings, CancellationToken ct = default);
    Task EnsureSeededAsync(CancellationToken ct = default);
}
