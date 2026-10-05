import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_state_provider.dart';
import '../../resume/presentation/widgets/resume_card.dart';
import '../../resume/presentation/widgets/upload_resume_sheet.dart';
import '../../resume/providers/resume_provider.dart';
import 'widgets/profile_header.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showUploadSheet(BuildContext context) {
    showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const UploadResumeSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final resumeState = ref.watch(resumeProvider);
    final activeResume = resumeState.activeResume;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Profile',
            onPressed: () {
              context.push('/profile/edit');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header
            if (user != null) ProfileHeader(user: user),
            const SizedBox(height: 24),

            // Resume Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Active Resume',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _showUploadSheet(context),
                  icon: const Icon(Icons.upload_file_rounded, size: 16),
                  label: Text(activeResume != null ? 'Replace' : 'Upload'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (activeResume != null)
              ResumeCard(
                resume: activeResume,
                onDelete: () {
                  ref
                      .read(resumeProvider.notifier)
                      .deleteResume(activeResume.id);
                },
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.slate200),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.description_outlined,
                      size: 36,
                      color: AppColors.slate400,
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'No Resume Uploaded',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Upload your resume in PDF or DOCX format to apply for jobs faster.',
                      style:
                          TextStyle(fontSize: 12.5, color: AppColors.slate500),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton(
                      onPressed: () => _showUploadSheet(context),
                      child: const Text('Upload Resume'),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 28),

            // Account & App Details
            const Text(
              'Account & System',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.slate900,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.badge_outlined,
                        color: AppColors.slate600),
                    title: const Text('Account Role'),
                    trailing: const Text(
                      'Candidate',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const Divider(height: 1, color: AppColors.slate200),
                  ListTile(
                    leading: const Icon(Icons.info_outline_rounded,
                        color: AppColors.slate600),
                    title: const Text('App Version'),
                    trailing: const Text(
                      'v1.0.0 (Phase 13-B)',
                      style: TextStyle(color: AppColors.slate500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Sign Out Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Sign Out'),
                      content: const Text('Are you sure you want to sign out?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(false),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          onPressed: () => Navigator.of(ctx).pop(true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.error,
                          ),
                          child: const Text('Sign Out'),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true && context.mounted) {
                    ref.read(authStateProvider.notifier).setUnauthenticated();
                    try {
                      final auth = ClerkAuth.of(context, listen: false);
                      await auth.signOut();
                    } catch (_) {}
                  }
                },
                icon: const Icon(Icons.logout_rounded, color: AppColors.error),
                label: const Text(
                  'Sign Out',
                  style: TextStyle(color: AppColors.error),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.errorContainer),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
