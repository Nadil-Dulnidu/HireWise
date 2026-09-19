namespace HireWise.Api.DTOs.PlatformSettings;

public class PlatformSettingDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public DateTime UpdatedAt { get; set; }
}

public class UpdatePlatformSettingsRequest
{
    public Dictionary<string, string> Settings { get; set; } = new();
}
