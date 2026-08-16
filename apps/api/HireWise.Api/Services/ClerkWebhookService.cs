using System.Text.Json;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Auth;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface IClerkWebhookService
{
    Task<bool> HandleWebhookAsync(string payload, IHeaderDictionary headers, CancellationToken ct = default);
}

public class ClerkWebhookService : IClerkWebhookService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ClerkWebhookService> _logger;

    public ClerkWebhookService(ApplicationDbContext db, ILogger<ClerkWebhookService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<bool> HandleWebhookAsync(string payload, IHeaderDictionary headers, CancellationToken ct = default)
    {
        try
        {
            var webhookEvent = JsonSerializer.Deserialize<ClerkWebhookEvent>(payload);
            if (webhookEvent == null || webhookEvent.Data == null)
            {
                _logger.LogWarning("Invalid Clerk webhook payload received.");
                return false;
            }

            _logger.LogInformation("Processing Clerk webhook event: {EventType} for Clerk User {ClerkUserId}",
                webhookEvent.Type, webhookEvent.Data.Id);

            switch (webhookEvent.Type)
            {
                case "user.created":
                    await HandleUserCreatedAsync(webhookEvent.Data, ct);
                    break;
                case "user.updated":
                    await HandleUserUpdatedAsync(webhookEvent.Data, ct);
                    break;
                case "user.deleted":
                    await HandleUserDeletedAsync(webhookEvent.Data.Id, ct);
                    break;
                default:
                    _logger.LogInformation("Unhandled Clerk webhook event type: {EventType}", webhookEvent.Type);
                    break;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Clerk webhook event");
            return false;
        }
    }

    private async Task HandleUserCreatedAsync(ClerkUserData data, CancellationToken ct)
    {
        var existing = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.ClerkUserId == data.Id, ct);
        if (existing != null)
        {
            _logger.LogInformation("User with Clerk ID {ClerkUserId} already exists. Skipping creation.", data.Id);
            return;
        }

        var email = data.EmailAddresses.FirstOrDefault()?.EmailAddress ?? string.Empty;
        var role = DetermineRole(data);
        var status = (role == UserRole.CANDIDATE) ? UserStatus.ACTIVE : UserStatus.PENDING_APPROVAL;

        var user = new User
        {
            ClerkUserId = data.Id,
            Email = email,
            FirstName = data.FirstName ?? string.Empty,
            LastName = data.LastName ?? string.Empty,
            ProfileImageUrl = data.ImageUrl,
            Role = role,
            Status = status
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created new user {UserId} ({Email}) with role {Role} and status {Status}",
            user.Id, user.Email, user.Role, user.Status);
    }

    private async Task HandleUserUpdatedAsync(ClerkUserData data, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == data.Id, ct);
        if (user == null)
        {
            _logger.LogWarning("User with Clerk ID {ClerkUserId} not found for update. Creating user instead.", data.Id);
            await HandleUserCreatedAsync(data, ct);
            return;
        }

        var email = data.EmailAddresses.FirstOrDefault()?.EmailAddress;
        if (!string.IsNullOrEmpty(email))
        {
            user.Email = email;
        }

        user.FirstName = data.FirstName ?? user.FirstName;
        user.LastName = data.LastName ?? user.LastName;
        if (!string.IsNullOrEmpty(data.ImageUrl))
        {
            user.ProfileImageUrl = data.ImageUrl;
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Updated user {UserId} ({Email}) from Clerk webhook", user.Id, user.Email);
    }

    private async Task HandleUserDeletedAsync(string clerkUserId, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId, ct);
        if (user != null)
        {
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Soft deleted user {UserId} ({Email}) from Clerk webhook", user.Id, user.Email);
        }
    }

    private static UserRole DetermineRole(ClerkUserData data)
    {
        // Check public_metadata then unsafe_metadata
        string? roleStr = null;

        if (data.PublicMetadata?.TryGetValue("role", out var publicRole) == true && publicRole != null)
        {
            roleStr = publicRole.ToString();
        }
        else if (data.UnsafeMetadata?.TryGetValue("role", out var unsafeRole) == true && unsafeRole != null)
        {
            roleStr = unsafeRole.ToString();
        }

        if (!string.IsNullOrEmpty(roleStr) && Enum.TryParse<UserRole>(roleStr, true, out var parsedRole))
        {
            return parsedRole;
        }

        return UserRole.CANDIDATE;
    }
}
