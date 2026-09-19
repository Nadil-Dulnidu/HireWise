namespace HireWise.Api.DTOs.Analytics;

public class PlatformStatsDto
{
    // Overview KPIs
    public int TotalUsers { get; set; }
    public int TotalCompanies { get; set; }
    public int TotalJobs { get; set; }
    public int ActiveJobs { get; set; }
    public int TotalApplications { get; set; }
    public int TotalInterviews { get; set; }
    public int TotalAiWorkflows { get; set; }

    // Breakdown dictionaries
    public Dictionary<string, int> UsersByRole { get; set; } = new();
    public Dictionary<string, int> UsersByStatus { get; set; } = new();
    public Dictionary<string, int> JobsByStatus { get; set; } = new();
    public Dictionary<string, int> ApplicationsByStatus { get; set; } = new();
    public Dictionary<string, int> InterviewsByStatus { get; set; } = new();
    public Dictionary<string, int> AiWorkflowsByStatus { get; set; } = new();

    // Time-series & Distribution charts for Recharts
    public List<MonthlyMetricDto> MonthlySignups { get; set; } = new();
    public List<MonthlyMetricDto> MonthlyApplications { get; set; } = new();
    public List<IndustryDistributionDto> IndustryDistribution { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class MonthlyMetricDto
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class IndustryDistributionDto
{
    public string Industry { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentActivityDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? Role { get; set; }
    public DateTime CreatedAt { get; set; }
}
