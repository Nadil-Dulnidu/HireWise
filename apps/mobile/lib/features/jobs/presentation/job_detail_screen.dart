import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/enums.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/utils/date_formatter.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/jobs_provider.dart';

class JobDetailScreen extends ConsumerWidget {
  final String jobId;

  const JobDetailScreen({super.key, required this.jobId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobDetailProvider(jobId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
      ),
      body: jobAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading details...'),
        error: (error, _) => ErrorView(
          error: error,
          onRetry: () => ref.refresh(jobDetailProvider(jobId)),
        ),
        data: (job) {
          if (job == null) {
            return const Center(child: Text('Job not found.'));
          }

          final isOpen = job.status == JobStatus.open;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header card
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
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryContainer
                                        .withOpacity(0.5),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Center(
                                    child: Text(
                                      job.companyName.isNotEmpty
                                          ? job.companyName[0].toUpperCase()
                                          : 'H',
                                      style: const TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 22,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        job.companyName,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.slate600,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        job.title,
                                        style: const TextStyle(
                                          fontSize: 19,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.slate900,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Divider(height: 1, color: AppColors.slate200),
                            const SizedBox(height: 14),

                            // Details grid
                            Wrap(
                              spacing: 16,
                              runSpacing: 10,
                              children: [
                                _DetailItem(
                                  icon: Icons.location_on_outlined,
                                  label: 'Location',
                                  value: job.location,
                                ),
                                _DetailItem(
                                  icon: Icons.work_outline_rounded,
                                  label: 'Type',
                                  value: job.employmentType.displayName,
                                ),
                                _DetailItem(
                                  icon: Icons.trending_up_rounded,
                                  label: 'Level',
                                  value: job.experienceLevel.displayName,
                                ),
                                _DetailItem(
                                  icon: Icons.payments_outlined,
                                  label: 'Salary',
                                  value: CurrencyFormatter.formatRange(
                                      job.salaryMin, job.salaryMax),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Status & deadline info
                      Row(
                        children: [
                          StatusBadge.forJob(job.status),
                          const Spacer(),
                          if (job.applicationDeadline != null)
                            Row(
                              children: [
                                const Icon(
                                  Icons.schedule_rounded,
                                  size: 15,
                                  color: AppColors.slate500,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Deadline: ${DateFormatter.formatDate(job.applicationDeadline)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.slate600,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Job Description
                      const Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.slate900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        job.description.isNotEmpty
                            ? job.description
                            : 'No description provided.',
                        style: const TextStyle(
                          fontSize: 14.5,
                          color: AppColors.slate700,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Requirements
                      const Text(
                        'Requirements',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.slate900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        job.requirements.isNotEmpty
                            ? job.requirements
                            : 'No specific requirements listed.',
                        style: const TextStyle(
                          fontSize: 14.5,
                          color: AppColors.slate700,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),

              // Bottom Apply Bar
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isOpen
                          ? () {
                              context.push('/jobs/${job.id}/apply');
                            }
                          : null,
                      child: Text(isOpen ? 'Apply Now' : 'Applications Closed'),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.slate500),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: AppColors.slate400),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.slate800,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
