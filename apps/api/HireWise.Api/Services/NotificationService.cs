using HireWise.Api.Data;
using HireWise.Api.Hubs;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(Guid userId, string title, string message, NotificationType type, string? referenceType = null, Guid? referenceId = null, CancellationToken ct = default);
    Task<List<Notification>> GetUserNotificationsAsync(Guid userId, int limit = 20, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default);
    Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext db, IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
    {
        _db = db;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task CreateNotificationAsync(Guid userId, string title, string message, NotificationType type, string? referenceType = null, Guid? referenceId = null, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            IsRead = false
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(ct);

        // Find user clerk id to send real-time notification
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user != null && !string.IsNullOrEmpty(user.ClerkUserId))
        {
            await _hubContext.Clients.Group($"user_{user.ClerkUserId}").SendAsync("ReceiveNotification", new
            {
                id = notification.Id,
                title = notification.Title,
                message = notification.Message,
                type = notification.Type.ToString(),
                referenceType = notification.ReferenceType,
                referenceId = notification.ReferenceId,
                createdAt = notification.CreatedAt
            }, ct);
        }

        _logger.LogInformation("Notification created for user {UserId}: {Title}", userId, title);
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(Guid userId, int limit = 20, CancellationToken ct = default)
    {
        return await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct);

        if (notification == null) return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = now;
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }
}
