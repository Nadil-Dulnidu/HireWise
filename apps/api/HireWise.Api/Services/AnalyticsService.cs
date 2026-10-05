using HireWise.Api.Data;
using HireWise.Api.DTOs.Analytics;
using HireWise.Api.DTOs.Common;
using HireWise.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace HireWise.Api.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(ApplicationDbContext db, ILogger<AnalyticsService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Result<PlatformStatsDto>> GetPlatformStatsAsync(CancellationToken ct = default)
    {
        try
        {
            var totalUsers = await _db.Users.CountAsync(ct);
            var totalCompanies = await _db.Companies.CountAsync(ct);
            var totalJobs = await _db.Jobs.CountAsync(ct);
            var activeJobs = await _db.Jobs.CountAsync(j => j.Status == JobStatus.OPEN, ct);
            var totalApplications = await _db.Applications.CountAsync(ct);
            var totalInterviews = await _db.Interviews.CountAsync(ct);
            var totalAiWorkflows = await _db.AiWorkflows.CountAsync(ct);

            // Groupings
            var usersByRoleList = await _db.Users
                .GroupBy(u => u.Role)
                .Select(g => new { Role = g.Key.ToString(), Count = g.Count() })
                .ToListAsync(ct);

            var usersByStatusList = await _db.Users
                .GroupBy(u => u.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync(ct);

            var jobsByStatusList = await _db.Jobs
                .GroupBy(j => j.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync(ct);

            var appsByStatusList = await _db.Applications
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync(ct);

            var interviewsByStatusList = await _db.Interviews
                .GroupBy(i => i.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync(ct);

            var aiWorkflowsByStatusList = await _db.AiWorkflows
                .GroupBy(w => w.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync(ct);

            // Industry distribution
            var industries = await _db.Companies
                .Where(c => !string.IsNullOrEmpty(c.Industry))
                .GroupBy(c => c.Industry!)
                .Select(g => new IndustryDistributionDto { Industry = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(6)
                .ToListAsync(ct);

            // Time series: Last 6 months
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
            var startDate = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var monthlySignupsRaw = await _db.Users
                .Where(u => u.CreatedAt >= startDate)
                .Select(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
                .ToListAsync(ct);

            var monthlyAppsRaw = await _db.Applications
                .Where(a => a.CreatedAt >= startDate)
                .Select(a => new { a.CreatedAt.Year, a.CreatedAt.Month })
                .ToListAsync(ct);

            var monthlySignups = new List<MonthlyMetricDto>();
            var monthlyApplications = new List<MonthlyMetricDto>();

            for (int i = 0; i < 6; i++)
            {
                var targetMonthDate = startDate.AddMonths(i);
                var monthLabel = targetMonthDate.ToString("MMM yyyy");

                var signupCount = monthlySignupsRaw.Count(x => x.Year == targetMonthDate.Year && x.Month == targetMonthDate.Month);
                var appCount = monthlyAppsRaw.Count(x => x.Year == targetMonthDate.Year && x.Month == targetMonthDate.Month);

                monthlySignups.Add(new MonthlyMetricDto { Month = monthLabel, Count = signupCount });
                monthlyApplications.Add(new MonthlyMetricDto { Month = monthLabel, Count = appCount });
            }

            // Recent activity from AuditLog
            var recentActivities = await _db.AuditLogs
                .OrderByDescending(a => a.CreatedAt)
                .Take(8)
                .Select(a => new RecentActivityDto
                {
                    Id = a.Id,
                    Action = a.Action,
                    EntityType = a.EntityType,
                    Role = a.Role,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync(ct);

            var stats = new PlatformStatsDto
            {
                TotalUsers = totalUsers,
                TotalCompanies = totalCompanies,
                TotalJobs = totalJobs,
                ActiveJobs = activeJobs,
                TotalApplications = totalApplications,
                TotalInterviews = totalInterviews,
                TotalAiWorkflows = totalAiWorkflows,
                UsersByRole = usersByRoleList.ToDictionary(x => x.Role, x => x.Count),
                UsersByStatus = usersByStatusList.ToDictionary(x => x.Status, x => x.Count),
                JobsByStatus = jobsByStatusList.ToDictionary(x => x.Status, x => x.Count),
                ApplicationsByStatus = appsByStatusList.ToDictionary(x => x.Status, x => x.Count),
                InterviewsByStatus = interviewsByStatusList.ToDictionary(x => x.Status, x => x.Count),
                AiWorkflowsByStatus = aiWorkflowsByStatusList.ToDictionary(x => x.Status, x => x.Count),
                IndustryDistribution = industries,
                MonthlySignups = monthlySignups,
                MonthlyApplications = monthlyApplications,
                RecentActivities = recentActivities
            };

            return Result<PlatformStatsDto>.Success(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve platform analytics stats");
            return Result<PlatformStatsDto>.Failure("Failed to calculate platform statistics.", 500);
        }
    }
}
