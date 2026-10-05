using HireWise.Api.DTOs.Interviews;
using HireWise.Api.DTOs.Notifications;

namespace HireWise.Api.DTOs.Users;

public class CandidateDashboardDto
{
    public int ActiveApplicationsCount { get; set; }
    public List<InterviewDto> UpcomingInterviews { get; set; } = new();
    public List<NotificationDto> RecentNotifications { get; set; } = new();
    public int OpenJobsCount { get; set; }
}
