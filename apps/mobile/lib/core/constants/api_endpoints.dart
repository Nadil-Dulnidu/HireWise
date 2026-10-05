class ApiEndpoints {
  ApiEndpoints._();

  // Users & Profile
  static const String currentUser = '/api/users/me';
  static const String updateProfile = '/api/users/me';
  static const String updateRole = '/api/users/me/role';
  static const String candidateDashboard = '/api/users/me/dashboard';

  // Jobs
  static const String jobs = '/api/jobs';
  static String jobById(String id) => '/api/jobs/$id';
  static String applyToJob(String jobId) => '/api/jobs/$jobId/applications';

  // Applications
  static const String myApplications = '/api/applications/me';
  static String applicationById(String id) => '/api/applications/$id';

  // Resumes
  static const String uploadResume = '/api/resumes/upload';
  static const String myResume = '/api/resumes/me';
  static String resumeById(String id) => '/api/resumes/$id';

  // Interviews
  static const String myInterviews = '/api/interviews/me';
  static String interviewById(String id) => '/api/interviews/$id';

  // Availability
  static const String myAvailability = '/api/availability/me';
  static const String availability = '/api/availability';
  static const String availabilityBulk = '/api/availability/bulk';
  static String availabilityById(String id) => '/api/availability/$id';

  // Notifications
  static const String notifications = '/api/notifications';
  static const String unreadNotificationsCount =
      '/api/notifications/unread-count';
  static String markNotificationRead(String id) =>
      '/api/notifications/$id/read';
  static const String markAllNotificationsRead = '/api/notifications/read-all';

  // SignalR Hub
  static const String notificationHub = '/hubs/notifications';

  // Health
  static const String health = '/api/health';
}
