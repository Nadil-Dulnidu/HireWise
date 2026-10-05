using AutoMapper;
using HireWise.Api.Data;
using HireWise.Api.DTOs.Notifications;
using HireWise.Api.Hubs;
using HireWise.Api.Models;
using HireWise.Api.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(Guid userId, string title, string message, NotificationType type, string? referenceType = null, Guid? referenceId = null, CancellationToken ct = default);
    Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 20, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default);
    Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);
    Task SendTypedAlertAsync(Guid userId, string eventType, object payload, CancellationToken ct = default);
    Task BroadcastToCompanyAsync(Guid companyId, string eventType, object payload, CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext db, IMapper mapper, IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
    {
        _db = db;
        _mapper = mapper;
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

            // Also send typed event based on notification type
            var typedEventName = type switch
            {
                NotificationType.APPLICATION_UPDATE => "ApplicationUpdate",
                NotificationType.INTERVIEW_SCHEDULED => "InterviewScheduled",
                NotificationType.AI_EVALUATION_COMPLETE => "AiEvaluationComplete",
                NotificationType.APPROVAL_REQUIRED => "ApprovalRequired",
                NotificationType.FEEDBACK_SUBMITTED => "FeedbackSubmitted",
                _ => null
            };

            if (typedEventName != null)
            {
                await _hubContext.Clients.Group($"user_{user.ClerkUserId}").SendAsync(typedEventName, new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    referenceType = notification.ReferenceType,
                    referenceId = notification.ReferenceId,
                    createdAt = notification.CreatedAt
                }, ct);
            }
        }

        _logger.LogInformation("Notification created for user {UserId}: {Title}", userId, title);
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, int limit = 20, CancellationToken ct = default)
    {
        var notifications = await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(ct);

        return _mapper.Map<List<NotificationDto>>(notifications);
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

    /// <summary>
    /// Send a typed real-time alert to a specific user without creating a persisted notification.
    /// Useful for transient UI updates like workflow step progress.
    /// </summary>
    public async Task SendTypedAlertAsync(Guid userId, string eventType, object payload, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null || string.IsNullOrEmpty(user.ClerkUserId)) return;

        await _hubContext.Clients.Group($"user_{user.ClerkUserId}").SendAsync(eventType, payload, ct);
        _logger.LogDebug("Typed alert '{EventType}' sent to user {UserId}", eventType, userId);
    }

    /// <summary>
    /// Broadcast a typed real-time alert to all members of a company group.
    /// Recruiters and interviewers in the same company will receive these alerts.
    /// </summary>
    public async Task BroadcastToCompanyAsync(Guid companyId, string eventType, object payload, CancellationToken ct = default)
    {
        await _hubContext.Clients.Group($"company_{companyId}").SendAsync(eventType, payload, ct);
        _logger.LogDebug("Company broadcast '{EventType}' sent to company {CompanyId}", eventType, companyId);
    }
}
