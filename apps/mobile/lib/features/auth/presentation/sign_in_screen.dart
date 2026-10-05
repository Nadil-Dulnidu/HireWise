import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/env_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_state_provider.dart';

class SignInScreen extends ConsumerWidget {
  const SignInScreen({super.key});

  void _showServerConfigDialog(BuildContext context, WidgetRef ref) {
    final currentUrl = ref.read(apiBaseUrlProvider);
    final controller = TextEditingController(text: currentUrl);

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.dns_rounded, color: AppColors.primary, size: 22),
            SizedBox(width: 8),
            Text(
              'Server Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter backend API URL or pick a preset:',
                style: TextStyle(fontSize: 13, color: AppColors.slate600),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                decoration: InputDecoration(
                  labelText: 'API Base URL',
                  hintText: 'http://10.216.20.214:5101',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                ),
                style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Quick Presets:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate700,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _presetChip(
                    'Wi-Fi (Current)',
                    'http://10.216.20.214:5101',
                    controller,
                  ),
                  _presetChip(
                    'USB (ADB Reverse)',
                    'http://localhost:5101',
                    controller,
                  ),
                  _presetChip(
                    'Home Wi-Fi',
                    'http://192.168.1.7:5101',
                    controller,
                  ),
                  _presetChip(
                    'Emulator',
                    'http://10.0.2.2:5101',
                    controller,
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final newUrl =
                  controller.text.trim().replaceAll(RegExp(r'/+$'), '');
              if (newUrl.isNotEmpty) {
                EnvConfig.apiBaseUrl = newUrl;
                ref.read(apiBaseUrlProvider.notifier).state = newUrl;
                Navigator.of(ctx).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Server updated to $newUrl'),
                    duration: const Duration(seconds: 2),
                  ),
                );
                ref.read(authStateProvider.notifier).syncWithBackend();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Save & Connect'),
          ),
        ],
      ),
    );
  }

  static Widget _presetChip(
    String label,
    String url,
    TextEditingController controller,
  ) {
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 11)),
      onPressed: () {
        controller.text = url;
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final clerkSession = ClerkAuth.sessionOf(context);
    final clerkUser = ClerkAuth.userOf(context);
    final isLoading = authState.status == AuthStatus.loading;
    final errorMessage = authState.errorMessage;
    final serverUrl = ref.watch(apiBaseUrlProvider);

    return Scaffold(
      backgroundColor: AppColors.slate50,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo & Header
                Image.asset(
                  'assets/images/main-logo.png',
                  height: 64,
                  width: 64,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.work_rounded,
                      size: 36,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'HireWise Candidate',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.slate900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Track your applications, interviews, and status in real-time',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.slate600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),

                // Error message banner if backend sync failed
                if (errorMessage != null && !isLoading)
                  Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.error.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.error_outline_rounded,
                              color: AppColors.error,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Cannot Connect to Server',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.error,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    errorMessage,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.slate700,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Target: $serverUrl',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.slate600,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () =>
                                    _showServerConfigDialog(context, ref),
                                icon: const Icon(
                                  Icons.settings_outlined,
                                  size: 15,
                                ),
                                label: const Text(
                                  'Change Server IP',
                                  style: TextStyle(fontSize: 12),
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 8),
                                  foregroundColor: AppColors.slate800,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: () {
                                ref
                                    .read(authStateProvider.notifier)
                                    .syncWithBackend();
                              },
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                // Loading indicator while syncing with backend
                if (isLoading)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 36,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.slate200),
                    ),
                    child: const Column(
                      children: [
                        CircularProgressIndicator(strokeWidth: 3),
                        SizedBox(height: 18),
                        Text(
                          'Connecting to HireWise...',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.slate900,
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Syncing your candidate account',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.slate500,
                          ),
                        ),
                      ],
                    ),
                  )
                else if (clerkSession != null)
                  // User is already signed in to Clerk, but needs backend sync
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.slate200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.account_circle_rounded,
                          color: AppColors.primary,
                          size: 52,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          clerkUser?.email ?? 'Signed in with Clerk',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.slate900,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Tap below to connect your profile and enter the app.',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.slate500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              ref
                                  .read(authStateProvider.notifier)
                                  .syncWithBackend();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Continue to HireWise',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextButton(
                          onPressed: () async {
                            try {
                              await ClerkAuth.of(context, listen: false)
                                  .signOut();
                            } catch (_) {}
                            ref
                                .read(authStateProvider.notifier)
                                .setUnauthenticated();
                          },
                          child: const Text(
                            'Sign in with a different account',
                            style: TextStyle(color: AppColors.slate600),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  // Clerk prebuilt authentication UI
                  const ClerkErrorListener(
                    child: ClerkAuthentication(),
                  ),

                const SizedBox(height: 24),
                InkWell(
                  onTap: () => _showServerConfigDialog(context, ref),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.dns_outlined,
                          size: 13,
                          color: AppColors.slate400,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Server: $serverUrl',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.slate500,
                            fontFamily: 'monospace',
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.edit_outlined,
                          size: 11,
                          color: AppColors.slate400,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
