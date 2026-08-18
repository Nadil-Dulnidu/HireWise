using System.Text.Json.Serialization;

namespace HireWise.Api.DTOs.AiCallback;

public class AiCallbackRequest
{
    [JsonPropertyName("workflow_id")]
    public Guid WorkflowId { get; set; }

    [JsonPropertyName("application_id")]
    public Guid ApplicationId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("final_result")]
    public object? FinalResult { get; set; }
}
