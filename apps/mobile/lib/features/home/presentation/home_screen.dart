import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../auth/providers/auth_state_provider.dart';
import '../../interviews/presentation/widgets/interview_card.dart';
import '../../notifications/presentation/widgets/notification_tile.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../providers/dashboard_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final dashboardState = ref.watch(dashboardProvider);
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.work_rounded,
                size: 20,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 10),
            const Text('HireWise'),
          ],
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                tooltip: 'Notifications',
                onPressed: () {
                  context.push('/notifications');
                },
              ),
              if (unreadCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Center(
                      child: Text(
                        unreadCount > 9 ? '9+' : '$unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Builder(
        builder: (context) {
          if (dashboardState.isLoading && dashboardState.data == null) {
            return const LoadingIndicator(message: 'Loading dashboard...');
          }

          if (dashboardState.errorMessage != null &&
              dashboardState.data == null) {
            return ErrorView(
              error: dashboardState.errorMessage,
              onRetry: () =>
                  ref.read(dashboardProvider.notifier).loadDashboard(),
            );
          }

          final data = dashboardState.data;

          return RefreshIndicator(
            onRefresh: () async {
              await Future.wait([
                ref.read(dashboardProvider.notifier).loadDashboard(),
                ref.read(notificationsProvider.notifier).loadNotifications(),
              ]);
            },
            color: AppColors.primary,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Greeting
                  Text(
                    'Hello, ${user?.firstName ?? "Candidate"} 👋',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.slate900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Stay on top of your job search progress',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.slate600,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stat Cards Grid
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          title: 'Active Applications',
                          value: '${data?.activeApplicationsCount ?? 0}',
                          icon: Icons.assignment_turned_in_outlined,
                          color: AppColors.primary,
                          onTap: () => context.go('/applications'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'Upcoming Interviews',
                          value: '${data?.upcomingInterviews.length ?? 0}',
                          icon: Icons.event_available_outlined,
                          color: const Color(0xFF7E22CE), // purple
                          onTap: () => context.go('/interviews'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _StatCardWide(
                    title: 'Open Tech Positions',
                    value: '${data?.openJobsCount ?? 0}',
                    subtitle: 'Explore active job openings',
                    icon: Icons.explore_outlined,
                    color: AppColors.info,
                    onTap: () => context.go('/jobs'),
                  ),
                  const SizedBox(height: 28),

                  // Upcoming Interviews Section
                  if (data != null && data.upcomingInterviews.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Next Interview',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppColors.slate900,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/interviews'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    InterviewCard(
                      interview: data.upcomingInterviews.first,
                      onTap: () {
                        context.push(
                            '/interviews/${data.upcomingInterviews.first.id}');
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Recent Notifications Section
                  if (data != null && data.recentNotifications.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Updates',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppColors.slate900,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push('/notifications'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.slate200),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        children: data.recentNotifications.take(3).map((notif) {
                          return NotificationTile(
                            notification: notif,
                            onTap: () {
                              final refType =
                                  notif.referenceType?.toLowerCase();
                              final refId = notif.referenceId;
                              if (refId != null && refId.isNotEmpty) {
                                if (refType == 'application') {
                                  context.push('/applications/$refId');
                                } else if (refType == 'interview') {
                                  context.push('/interviews/$refId');
                                }
                              } else {
                                context.push('/notifications');
                              }
                            },
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 14),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.slate900,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: AppColors.slate600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCardWide extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _StatCardWide({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate900,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.slate500,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.slate900,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right_rounded, color: AppColors.slate400),
          ],
        ),
      ),
    );
  }
}
