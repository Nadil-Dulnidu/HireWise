import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../jobs/providers/jobs_provider.dart';
import '../../resume/presentation/widgets/resume_card.dart';
import '../../resume/presentation/widgets/upload_resume_sheet.dart';
import '../../resume/providers/resume_provider.dart';
import '../providers/applications_provider.dart';

class ApplyScreen extends ConsumerStatefulWidget {
  final String jobId;

  const ApplyScreen({super.key, required this.jobId});

  @override
  ConsumerState<ApplyScreen> createState() => _ApplyScreenState();
}

class _ApplyScreenState extends ConsumerState<ApplyScreen> {
  final _coverLetterController = TextEditingController();

  @override
  void dispose() {
    _coverLetterController.dispose();
    super.dispose();
  }

  void _showUploadSheet() {
    showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const UploadResumeSheet(),
    );
  }

  Future<void> _submitApplication() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Submission'),
        content: const Text(
          'Are you ready to submit your application? Your active resume and cover letter will be sent to the hiring team.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Review'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final controller = ref.read(applyJobControllerProvider);
    final application = await controller.apply(
      jobId: widget.jobId,
      coverLetter: _coverLetterController.text.trim().isNotEmpty
          ? _coverLetterController.text.trim()
          : null,
    );

    if (mounted) {
      if (application != null) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: AppColors.success),
                SizedBox(width: 8),
                Text('Application Submitted!'),
              ],
            ),
            content: const Text(
              'Your application was successfully received. Our AI screening process and recruiter review will begin shortly.',
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  context.pushReplacement('/applications/${application.id}');
                },
                child: const Text('Track Application'),
              ),
            ],
          ),
        );
      } else {
        final error = ref.read(applyJobErrorProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? 'Failed to submit application.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobAsync = ref.watch(jobDetailProvider(widget.jobId));
    final resumeState = ref.watch(resumeProvider);
    final isSubmitting = ref.watch(applyJobLoadingProvider);
    final activeResume = resumeState.activeResume;
    final hasResume = activeResume != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply for Job'),
      ),
      body: jobAsync.when(
        loading: () =>
            const LoadingIndicator(message: 'Loading job details...'),
        error: (error, _) => Center(
          child: Text('Error loading job: $error'),
        ),
        data: (job) {
          if (job == null) {
            return const Center(child: Text('Job not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Job Summary Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.slate200),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            job.companyName.isNotEmpty
                                ? job.companyName[0].toUpperCase()
                                : 'H',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              job.title,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.slate900,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${job.companyName} • ${job.location}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.slate600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Step 1: Resume Requirement
                const Text(
                  '1. Resume',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 8),
                if (hasResume)
                  ResumeCard(resume: activeResume)
                else
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.warningContainer.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(12),
                      border:
                          Border.all(color: AppColors.warning.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.warning_amber_rounded,
                                color: AppColors.warning),
                            SizedBox(width: 8),
                            Text(
                              'No Active Resume Found',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppColors.slate900,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'You must upload a resume before submitting your application.',
                          style: TextStyle(
                              fontSize: 13, color: AppColors.slate700),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed: _showUploadSheet,
                          icon: const Icon(Icons.upload_file_rounded, size: 18),
                          label: const Text('Upload Resume'),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 24),

                // Step 2: Cover Letter (Optional)
                const Text(
                  '2. Cover Letter (Optional)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _coverLetterController,
                  maxLines: 6,
                  decoration: const InputDecoration(
                    hintText:
                        'Highlight your relevant experience, technical strengths, and why you are interested in this role...',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 32),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        hasResume && !isSubmitting ? _submitApplication : null,
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Submit Application'),
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
