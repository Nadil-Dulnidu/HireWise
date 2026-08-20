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
        if (context.User.Identity?.IsAuthenticated == true && context.User.Identity is ClaimsIdentity identity)
        {
            var clerkUserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? context.User.FindFirst("sub")?.Value;
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value
                ?? context.User.FindFirst("role")?.Value
                ?? context.Request.Headers["X-Clerk-Role"].FirstOrDefault();
            var orgId = context.User.FindFirst("org_id")?.Value
                ?? context.User.FindFirst("organization_id")?.Value
                ?? context.Request.Headers["X-Clerk-Org-Id"].FirstOrDefault();
            var orgRole = context.User.FindFirst("org_role")?.Value;

            // Ensure NameIdentifier claim is present
            if (context.User.FindFirst(ClaimTypes.NameIdentifier) == null && !string.IsNullOrEmpty(clerkUserId))
            {
                identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, clerkUserId));
            }

            // Resolve role from org_role or DB lookup if not present in token claims
            if (string.IsNullOrEmpty(role))
            {
                if (!string.IsNullOrEmpty(orgRole))
                {
                    role = orgRole == "org:admin" ? "RECRUITER" : "INTERVIEWER";
                }
                else if (!string.IsNullOrEmpty(clerkUserId))
                {
                    var roleCacheKey = $"UserRole_{clerkUserId}";
                    if (!memoryCache.TryGetValue(roleCacheKey, out string? cachedRole))
                    {
                        using var scope = serviceProvider.CreateScope();
                        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var dbUser = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
                        if (dbUser != null)
                        {
                            cachedRole = dbUser.Role.ToString();
                            memoryCache.Set(roleCacheKey, cachedRole, TimeSpan.FromMinutes(5));
                        }
                    }
                    role = cachedRole;
                }

                if (!string.IsNullOrEmpty(role))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));
                    identity.AddClaim(new Claim("role", role));
                }
            }

            // Resolve CompanyId from Clerk Org or DB User
            Guid? resolvedCompanyId = null;
            if (!string.IsNullOrEmpty(orgId))
            {
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
                        resolvedCompanyId = companyId;
                    }
                }
                else
                {
                    resolvedCompanyId = companyId;
                }
            }
            else if (!string.IsNullOrEmpty(clerkUserId))
            {
                var userCompCacheKey = $"UserCompanyId_{clerkUserId}";
                if (!memoryCache.TryGetValue(userCompCacheKey, out Guid userCompId))
                {
                    using var scope = serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var dbUser = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
                    if (dbUser?.CompanyId != null)
                    {
                        userCompId = dbUser.CompanyId.Value;
                        memoryCache.Set(userCompCacheKey, userCompId, TimeSpan.FromMinutes(5));
                        resolvedCompanyId = userCompId;
                    }
                }
                else
                {
                    resolvedCompanyId = userCompId;
                }
            }

            // Resolve DB UserId
            Guid? resolvedDbUserId = null;
            if (!string.IsNullOrEmpty(clerkUserId))
            {
                var userIdCacheKey = $"DbUserId_{clerkUserId}";
                if (!memoryCache.TryGetValue(userIdCacheKey, out Guid cachedDbUserId))
                {
                    using var scope = serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var dbUser = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.ClerkUserId == clerkUserId);
                    if (dbUser != null)
                    {
                        cachedDbUserId = dbUser.Id;
                        memoryCache.Set(userIdCacheKey, cachedDbUserId, TimeSpan.FromMinutes(5));
                        resolvedDbUserId = cachedDbUserId;
                        
                        // Also populate companyId if not resolved yet
                        if (!resolvedCompanyId.HasValue && dbUser.CompanyId.HasValue)
                        {
                            resolvedCompanyId = dbUser.CompanyId.Value;
                        }
                    }
                }
                else
                {
                    resolvedDbUserId = cachedDbUserId;
                }
            }

            if (resolvedDbUserId.HasValue)
            {
                context.Items["UserId"] = resolvedDbUserId.Value;
                if (context.User.FindFirst("user_id") == null)
                {
                    identity.AddClaim(new Claim("user_id", resolvedDbUserId.Value.ToString()));
                }
            }

            if (resolvedCompanyId.HasValue)
            {
                context.Items["CompanyId"] = resolvedCompanyId.Value;
                if (context.User.FindFirst("company_id") == null)
                {
                    identity.AddClaim(new Claim("company_id", resolvedCompanyId.Value.ToString()));
                }
            }

            using (LogContext.PushProperty("ClerkUserId", clerkUserId ?? "anonymous"))
            using (LogContext.PushProperty("DbUserId", resolvedDbUserId?.ToString() ?? "none"))
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
