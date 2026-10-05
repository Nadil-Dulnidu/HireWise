import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/main-logo.png',
              width: 72,
              height: 72,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.work_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'HireWise',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.slate900,
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'AI-Powered Recruitment',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.slate500,
              ),
            ),
            SizedBox(height: 32),
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
