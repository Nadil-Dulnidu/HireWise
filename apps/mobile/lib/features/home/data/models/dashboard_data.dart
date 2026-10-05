import '../../../interviews/data/models/interview_dto.dart';
import '../../../notifications/data/models/notification_dto.dart';

class DashboardData {
  final int activeApplicationsCount;
  final List<InterviewDto> upcomingInterviews;
  final List<NotificationDto> recentNotifications;
  final int openJobsCount;

  const DashboardData({
    required this.activeApplicationsCount,
    required this.upcomingInterviews,
    required this.recentNotifications,
    required this.openJobsCount,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final rawInterviews = json['upcomingInterviews'] as List<dynamic>? ?? [];
    final rawNotifications =
        json['recentNotifications'] as List<dynamic>? ?? [];

    return DashboardData(
      activeApplicationsCount: json['activeApplicationsCount'] as int? ?? 0,
      upcomingInterviews: rawInterviews
          .map((i) => InterviewDto.fromJson(i as Map<String, dynamic>))
          .toList(),
      recentNotifications: rawNotifications
          .map((n) => NotificationDto.fromJson(n as Map<String, dynamic>))
          .toList(),
      openJobsCount: json['openJobsCount'] as int? ?? 0,
    );
  }
}
