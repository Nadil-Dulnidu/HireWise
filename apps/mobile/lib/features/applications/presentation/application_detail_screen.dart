import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/date_formatter.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/applications_provider.dart';
import 'widgets/status_timeline.dart';

// Screen displaying detailed status, timeline, and submission details for a job application
class ApplicationDetailScreen extends ConsumerWidget {
  final String applicationId;

  const ApplicationDetailScreen({
    super.key,
    required this.applicationId,
  });

  // Build the application detail screen and watch provider data
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch application detail provider for live updates
    final appAsync = ref.watch(applicationDetailProvider(applicationId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Application Status'),
      ),
      body: appAsync.when(
        loading: () =>
            const LoadingIndicator(message: 'Loading application details...'),
        error: (error, _) => ErrorView(
          error: error,
          onRetry: () => ref.refresh(applicationDetailProvider(applicationId)),
        ),
        data: (app) {
          // Handle case when application data is not found
          if (app == null) {
            return const Center(child: Text('Application not found.'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.slate200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  app.companyName,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.slate600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  app.jobTitle,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.slate900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          StatusBadge.forApplication(app.status),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today_outlined,
                            size: 14,
                            color: AppColors.slate400,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Submitted on ${DateFormatter.formatDate(app.appliedAt)}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.slate500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Progress Timeline
                const Text(
                  'Application Timeline',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 12),
                StatusTimeline(currentStatus: app.status),
                const SizedBox(height: 24),

                // Interview Banner if scheduled
                if (app.hasInterviewScheduled && app.interviewId != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(12),
                      border:
                          Border.all(color: AppColors.primary.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.event_available_rounded,
                          color: AppColors.primary,
                          size: 28,
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Interview Scheduled!',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'View interview date, time, and meeting link.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.slate700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            // Navigate to interview details screen
                            context.push('/interviews/${app.interviewId}');
                          },
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                          ),
                          child: const Text('View',
                              style: TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Cover Letter if provided
                if (app.coverLetter != null && app.coverLetter!.isNotEmpty) ...[
                  const Text(
                    'Cover Letter',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.slate200),
                    ),
                    child: Text(
                      app.coverLetter!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.slate700,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // View Job Details Link
                OutlinedButton.icon(
                  onPressed: () {
                    // Navigate to the original job posting
                    context.push('/jobs/${app.jobId}');
                  },
                  icon: const Icon(Icons.launch_rounded, size: 16),
                  label: const Text('View Original Job Posting'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 46),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
