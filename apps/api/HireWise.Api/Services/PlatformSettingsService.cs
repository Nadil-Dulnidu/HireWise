using HireWise.Api.Data;
using HireWise.Api.DTOs.Common;
using HireWise.Api.DTOs.PlatformSettings;
using HireWise.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public class PlatformSettingsService : IPlatformSettingsService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<PlatformSettingsService> _logger;

    public PlatformSettingsService(ApplicationDbContext db, ILogger<PlatformSettingsService> logger)
    {
        _db = db;
        _logger = logger;
    }

    private static List<PlatformSetting> GetDefaultSettings() => new()
    {
        new PlatformSetting { Key = "PlatformName", Value = "HireWise Recruitment Platform", Description = "Public platform brand name displayed in headers and emails.", Category = "General" },
        new PlatformSetting { Key = "SupportEmail", Value = "support@hirewise.dev", Description = "Primary support email address for candidates and recruiters.", Category = "General" },
        new PlatformSetting { Key = "PlatformLogoUrl", Value = "", Description = "Custom platform logo image URL.", Category = "General" },
        new PlatformSetting { Key = "DefaultTimezone", Value = "UTC", Description = "Default timezone for interview scheduling slots and timestamps.", Category = "General" },
        new PlatformSetting { Key = "CandidateSelfRegistration", Value = "true", Description = "Allow external candidates to self-register and submit applications.", Category = "General" },
        new PlatformSetting { Key = "MaxApplicationsPerCandidate", Value = "10", Description = "Maximum active applications allowed concurrently per candidate.", Category = "Recruitment" },
        new PlatformSetting { Key = "AutoArchiveClosedJobsDays", Value = "30", Description = "Days after which closed job requisitions are archived.", Category = "Recruitment" },
        new PlatformSetting { Key = "EnableAiValidationGuardrails", Value = "true", Description = "Enforce AI schema validation and anti-hallucination checks across workflows.", Category = "AI" }
    };

    public async Task EnsureSeededAsync(CancellationToken ct = default)
    {
        if (!await _db.PlatformSettings.AnyAsync(ct))
        {
            _logger.LogInformation("Seeding default platform settings...");
            var defaults = GetDefaultSettings();
            _db.PlatformSettings.AddRange(defaults);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Seeded {Count} platform settings.", defaults.Count);
        }
    }

    public async Task<Result<List<PlatformSettingDto>>> GetAllAsync(CancellationToken ct = default)
    {
        await EnsureSeededAsync(ct);

        var list = await _db.PlatformSettings
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Key)
            .Select(s => new PlatformSettingDto
            {
                Id = s.Id,
                Key = s.Key,
                Value = s.Value,
                Description = s.Description,
                Category = s.Category,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync(ct);

        return Result<List<PlatformSettingDto>>.Success(list);
    }

    public async Task<Result<string>> GetValueAsync(string key, string defaultValue = "", CancellationToken ct = default)
    {
        var setting = await _db.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        return Result<string>.Success(setting?.Value ?? defaultValue);
    }

    public async Task<Result<List<PlatformSettingDto>>> UpdateBulkAsync(Dictionary<string, string> settings, CancellationToken ct = default)
    {
        await EnsureSeededAsync(ct);

        var existing = await _db.PlatformSettings.ToListAsync(ct);

        foreach (var (key, value) in settings)
        {
            var match = existing.FirstOrDefault(s => s.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                match.Value = value ?? string.Empty;
                match.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.PlatformSettings.Add(new PlatformSetting
                {
                    Key = key,
                    Value = value ?? string.Empty,
                    Description = $"Custom setting: {key}",
                    Category = "General"
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated {Count} platform settings.", settings.Count);

        return await GetAllAsync(ct);
    }
}
