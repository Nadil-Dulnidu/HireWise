using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace HireWise.Api.Services.Ai;

public interface IAiServiceClient
{
    Task<bool> TriggerApplicationEvaluationAsync(Guid applicationId, string jobTitle, string jobDescription, string jobRequirements, string resumeUrl, CancellationToken ct = default);
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

        var baseUrl = _config["AiService:BaseUrl"] ?? "http://localhost:8000";
        var apiKey = _config["AiService:ApiKey"] ?? "hw_ai_service_secret_key";

        _httpClient.BaseAddress = new Uri(baseUrl);
        _httpClient.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<bool> TriggerApplicationEvaluationAsync(Guid applicationId, string jobTitle, string jobDescription, string jobRequirements, string resumeUrl, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                application_id = applicationId,
                job_title = jobTitle,
                job_description = jobDescription,
                job_requirements = jobRequirements,
                candidate_resume_url = resumeUrl
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
}
