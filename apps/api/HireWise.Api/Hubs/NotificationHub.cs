using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HireWise.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        _logger.LogInformation("Client connected to NotificationHub: {ConnectionId}, User: {UserId}", Context.ConnectionId, userId);

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected from NotificationHub: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Explicitly join user group by Clerk User ID
    /// </summary>
    public async Task JoinUserGroup(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        _logger.LogInformation("Connection {ConnectionId} explicitly joined user group: user_{UserId}", Context.ConnectionId, userId);
    }

    /// <summary>
    /// Allows recruiters/interviewers to subscribe to company-level real-time alerts.
    /// </summary>
    public async Task JoinCompanyGroup(string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId)) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"company_{companyId}");
        _logger.LogInformation("Connection {ConnectionId} joined company group: {CompanyId}", Context.ConnectionId, companyId);
    }

    /// <summary>
    /// Allows users to unsubscribe from company-level alerts.
    /// </summary>
    public async Task LeaveCompanyGroup(string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId)) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"company_{companyId}");
        _logger.LogInformation("Connection {ConnectionId} left company group: {CompanyId}", Context.ConnectionId, companyId);
    }
}
