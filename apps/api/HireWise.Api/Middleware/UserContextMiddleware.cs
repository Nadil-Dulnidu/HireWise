using System.Security.Claims;
using Serilog.Context;

namespace HireWise.Api.Middleware;

public class UserContextMiddleware
{
    private readonly RequestDelegate _next;

    public UserContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var clerkUserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? context.User.FindFirst("sub")?.Value;
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value
                ?? context.User.FindFirst("role")?.Value;

            using (LogContext.PushProperty("ClerkUserId", clerkUserId ?? "anonymous"))
            using (LogContext.PushProperty("UserRole", role ?? "none"))
            {
                await _next(context);
                return;
            }
        }

        await _next(context);
    }
}
