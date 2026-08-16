using System.Text.Json.Serialization;

namespace HireWise.Api.DTOs.Auth;

public class ClerkWebhookEvent
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("object")]
    public string Object { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public ClerkUserData? Data { get; set; }
}

public class ClerkUserData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email_addresses")]
    public List<ClerkEmailAddress> EmailAddresses { get; set; } = new();

    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }

    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("public_metadata")]
    public Dictionary<string, object>? PublicMetadata { get; set; }

    [JsonPropertyName("unsafe_metadata")]
    public Dictionary<string, object>? UnsafeMetadata { get; set; }
}

public class ClerkEmailAddress
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email_address")]
    public string EmailAddress { get; set; } = string.Empty;
}
