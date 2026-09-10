using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace HireWise.Api.Services;

public class ClerkSyncService : IClerkSyncService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ClerkSyncService> _logger;

    public ClerkSyncService(HttpClient httpClient, IConfiguration configuration, ILogger<ClerkSyncService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SyncUserRoleAsync(string clerkUserId, string role, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            _logger.LogWarning("Clerk sync skipped: clerkUserId is empty.");
            return false;
        }

        // Avoid attempting to sync local mock/seed users
        if (clerkUserId.StartsWith("user_admin_seed") || clerkUserId.StartsWith("user_seed_"))
        {
            _logger.LogInformation("Clerk sync skipped for mock/seed user {ClerkUserId}", clerkUserId);
            return true;
        }

        var secretKey = _configuration["CLERK_SECRET_KEY"]
            ?? _configuration["Clerk:SecretKey"]
            ?? _configuration["Clerk__SecretKey"];

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            _logger.LogWarning("Clerk sync skipped for user {ClerkUserId}: CLERK_SECRET_KEY is not configured.", clerkUserId);
            return false;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Patch, $"https://api.clerk.com/v1/users/{clerkUserId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

            var payload = new
            {
                public_metadata = new Dictionary<string, object>
                {
                    { "role", role }
                }
            };

            request.Content = JsonContent.Create(payload);

            var response = await _httpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Failed to update Clerk publicMetadata for user {ClerkUserId}. Status: {StatusCode}, Error: {Error}",
                    clerkUserId, response.StatusCode, errorContent);
                return false;
            }

            _logger.LogInformation("Successfully synced role '{Role}' to Clerk publicMetadata for user {ClerkUserId}", role, clerkUserId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while syncing role to Clerk for user {ClerkUserId}", clerkUserId);
            return false;
        }
    }
}
