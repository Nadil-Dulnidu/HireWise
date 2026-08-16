using HireWise.Api.DTOs.Common;
using HireWise.Api.Models;
using HireWise.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireWise.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public NotificationsController(
        INotificationService notificationService,
        IUserService userService,
        ICurrentUserService currentUserService)
    {
        _notificationService = notificationService;
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 20, CancellationToken ct = default)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId)) return Unauthorized();

        var userResult = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!userResult.IsSuccess) return NotFound();

        var notifications = await _notificationService.GetUserNotificationsAsync(userResult.Value!.Id, limit, ct);
        return Ok(ApiResponse<List<Notification>>.Ok(notifications));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct = default)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId)) return Unauthorized();

        var userResult = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!userResult.IsSuccess) return NotFound();

        var count = await _notificationService.GetUnreadCountAsync(userResult.Value!.Id, ct);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct = default)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId)) return Unauthorized();

        var userResult = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!userResult.IsSuccess) return NotFound();

        var success = await _notificationService.MarkAsReadAsync(id, userResult.Value!.Id, ct);
        return Ok(ApiResponse<bool>.Ok(success));
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct = default)
    {
        var clerkUserId = _currentUserService.ClerkUserId;
        if (string.IsNullOrEmpty(clerkUserId)) return Unauthorized();

        var userResult = await _userService.GetCurrentUserAsync(clerkUserId, ct);
        if (!userResult.IsSuccess) return NotFound();

        var success = await _notificationService.MarkAllAsReadAsync(userResult.Value!.Id, ct);
        return Ok(ApiResponse<bool>.Ok(success));
    }
}
