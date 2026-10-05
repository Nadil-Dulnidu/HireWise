import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import 'widgets/availability_view.dart';

class AvailabilityScreen extends StatelessWidget {
  const AvailabilityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Interview Availability'),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: AppColors.slate200,
            height: 1,
          ),
        ),
      ),
      body: const SafeArea(
        child: AvailabilityView(),
      ),
    );
  }
}
