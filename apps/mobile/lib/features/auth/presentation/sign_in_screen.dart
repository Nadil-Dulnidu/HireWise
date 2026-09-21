import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                Container(
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

                // Clerk prebuilt authentication UI
                const ClerkErrorListener(
                  child: ClerkAuthentication(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
