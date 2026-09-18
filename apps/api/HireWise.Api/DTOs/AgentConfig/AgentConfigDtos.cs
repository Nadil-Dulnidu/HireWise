namespace HireWise.Api.DTOs.AgentConfig;

public class AgentConfigDto
{
    public Guid Id { get; set; }
    public string AgentKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-2.5-flash";
    public string SystemPrompt { get; set; } = string.Empty;
    public double Temperature { get; set; } = 0.2;
    public int MaxTokens { get; set; } = 4096;
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAgentConfigRequest
{
    public string? Model { get; set; }
    public string? SystemPrompt { get; set; }
    public double? Temperature { get; set; }
    public int? MaxTokens { get; set; }
    public bool? IsActive { get; set; }
}
