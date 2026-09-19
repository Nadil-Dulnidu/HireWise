using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace HireWise.Api.Services.Ai;

public interface IAiServiceClient
{
    Task<bool> TriggerApplicationEvaluationAsync(
        Guid applicationId,
        string jobTitle,
        string jobDescription,
        string jobRequirements,
        string resumeUrl,
        string? candidateId = null,
        string? interviewerId = null,
        object? candidateSlots = null,
        object? interviewerSlots = null,
        CancellationToken ct = default);
    Task<JsonElement?> GetWorkflowDetailsAsync(Guid workflowId, CancellationToken ct = default);
    Task<JsonElement?> GetWorkflowStepsAsync(Guid workflowId, CancellationToken ct = default);
    Task<JsonElement?> GetWorkflowStatusAsync(Guid workflowId, CancellationToken ct = default);
    Task<bool> ApproveCandidateEvaluationAsync(Guid workflowId, string decision, Guid? approvedByUserId = null, string? notes = null, CancellationToken ct = default);
}

public class AiServiceClient : IAiServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<AiServiceClient> _logger;

    public AiServiceClient(HttpClient httpClient, IConfiguration config, ILogger<AiServiceClient> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;

        var baseUrl = !string.IsNullOrWhiteSpace(_config["AI_SERVICE_BASE_URL"])
            ? _config["AI_SERVICE_BASE_URL"]!
            : (!string.IsNullOrWhiteSpace(_config["AiService:BaseUrl"])
                ? _config["AiService:BaseUrl"]!
                : "http://localhost:8000");

        var apiKey = !string.IsNullOrWhiteSpace(_config["AI_SERVICE_API_KEY"])
            ? _config["AI_SERVICE_API_KEY"]!
            : (!string.IsNullOrWhiteSpace(_config["AiService:ApiKey"])
                ? _config["AiService:ApiKey"]!
                : "hw_ai_service_secret_key");

        _httpClient.BaseAddress = new Uri(baseUrl);
        _httpClient.DefaultRequestHeaders.Remove("X-Api-Key");
        _httpClient.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<bool> TriggerApplicationEvaluationAsync(
        Guid applicationId,
        string jobTitle,
        string jobDescription,
        string jobRequirements,
        string resumeUrl,
        string? candidateId = null,
        string? interviewerId = null,
        object? candidateSlots = null,
        object? interviewerSlots = null,
        CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                application_id = applicationId,
                job_title = jobTitle,
                job_description = jobDescription,
                job_requirements = jobRequirements,
                candidate_resume_url = resumeUrl,
                candidate_id = candidateId,
                interviewer_id = interviewerId,
                candidate_slots = candidateSlots,
                interviewer_slots = interviewerSlots
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            _logger.LogInformation("Calling AI Service to trigger evaluation workflow for Application {ApplicationId}...", applicationId);

            var response = await _httpClient.PostAsync("/api/v1/workflows/evaluate", content, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully initiated AI evaluation for Application {ApplicationId}", applicationId);
                return true;
            }

            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("AI Service returned non-success status code {StatusCode} for Application {ApplicationId}: {Error}",
                response.StatusCode, applicationId, errorBody);

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to AI Service for Application {ApplicationId}. Will fallback gracefully.", applicationId);
            return false;
        }
    }

    public async Task<JsonElement?> GetWorkflowDetailsAsync(Guid workflowId, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/workflows/{workflowId}/details", ct);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(content);
            return doc.RootElement.Clone();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch workflow details from AI Service for {WorkflowId}", workflowId);
            return null;
        }
    }

    public async Task<JsonElement?> GetWorkflowStepsAsync(Guid workflowId, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/workflows/{workflowId}/steps", ct);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(content);
            return doc.RootElement.Clone();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch workflow steps from AI Service for {WorkflowId}", workflowId);
            return null;
        }
    }

    public async Task<JsonElement?> GetWorkflowStatusAsync(Guid workflowId, CancellationToken ct = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/workflows/{workflowId}", ct);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(content);
            return doc.RootElement.Clone();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch workflow status from AI Service for {WorkflowId}", workflowId);
            return null;
        }
    }

    public async Task<bool> ApproveCandidateEvaluationAsync(Guid workflowId, string decision, Guid? approvedByUserId = null, string? notes = null, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                decision = decision,
                approved_by_user_id = approvedByUserId,
                notes = notes
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            _logger.LogInformation("Calling AI Service to submit evaluation approval for Workflow {WorkflowId} (Decision: {Decision})...", workflowId, decision);

            var response = await _httpClient.PostAsync($"/api/v1/workflows/{workflowId}/approve-evaluation", content, ct);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully submitted evaluation approval for Workflow {WorkflowId}", workflowId);
                return true;
            }

            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("AI Service returned non-success status code {StatusCode} for Workflow approval {WorkflowId}: {Error}",
                response.StatusCode, workflowId, errorBody);

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit evaluation approval to AI Service for Workflow {WorkflowId}", workflowId);
            return false;
        }
    }
}
