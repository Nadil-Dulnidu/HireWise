using System.Security.Claims;
using HireWise.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Serilog.Context;

namespace HireWise.Api.Middleware;

public class UserContextMiddleware
{
    private readonly RequestDelegate _next;

    public UserContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IMemoryCache memoryCache, IServiceProvider serviceProvider)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var clerkUserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? context.User.FindFirst("sub")?.Value;
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value
                ?? context.User.FindFirst("role")?.Value;
            var orgId = context.User.FindFirst("org_id")?.Value
                ?? context.User.FindFirst("organization_id")?.Value;

            if (!string.IsNullOrEmpty(orgId))
            {
                // Cache org_id to CompanyId mapping for high performance
                var cacheKey = $"ClerkOrgId_CompanyId_{orgId}";
                if (!memoryCache.TryGetValue(cacheKey, out Guid companyId))
                {
                    using var scope = serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var company = await db.Companies
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.ClerkOrganizationId == orgId);

                    if (company != null)
                    {
                        companyId = company.Id;
                        memoryCache.Set(cacheKey, companyId, TimeSpan.FromMinutes(10));
                        context.Items["CompanyId"] = companyId;
                    }
                }
                else
                {
                    context.Items["CompanyId"] = companyId;
                }
            }

            using (LogContext.PushProperty("ClerkUserId", clerkUserId ?? "anonymous"))
            using (LogContext.PushProperty("UserRole", role ?? "none"))
            using (LogContext.PushProperty("ClerkOrganizationId", orgId ?? "none"))
            {
                await _next(context);
                return;
            }
        }

        await _next(context);
    }
}
