import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../availability/presentation/widgets/availability_view.dart';
import '../providers/interviews_provider.dart';
import 'widgets/interview_card.dart';

class InterviewsScreen extends ConsumerWidget {
  const InterviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(interviewsProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Interviews'),
          bottom: const TabBar(
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.slate500,
            indicatorWeight: 2.5,
            tabs: [
              Tab(text: 'Upcoming'),
              Tab(text: 'Past'),
              Tab(text: 'My Availability'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Upcoming Tab
            _buildUpcomingTab(context, ref, state),

            // Past Tab
            _buildPastTab(context, ref, state),

            // Availability Tab
            const AvailabilityView(),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingTab(
      BuildContext context, WidgetRef ref, InterviewsState state) {
    if (state.isLoading && state.interviews.isEmpty) {
      return const LoadingIndicator(message: 'Loading your interviews...');
    }

    if (state.errorMessage != null && state.interviews.isEmpty) {
      return ErrorView(
        error: state.errorMessage,
        onRetry: () => ref.read(interviewsProvider.notifier).loadInterviews(),
      );
    }

    final upcoming = state.upcomingInterviews;

    return RefreshIndicator(
      onRefresh: () => ref.read(interviewsProvider.notifier).loadInterviews(),
      color: AppColors.primary,
      child: upcoming.isEmpty
          ? const EmptyState(
              icon: Icons.event_busy_outlined,
              title: 'No Upcoming Interviews',
              message:
                  'When an interviewer schedules an interview for one of your applications, it will appear here.',
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: upcoming.length,
              itemBuilder: (context, index) {
                final interview = upcoming[index];
                return InterviewCard(
                  interview: interview,
                  onTap: () {
                    context.push('/interviews/${interview.id}');
                  },
                );
              },
            ),
    );
  }

  Widget _buildPastTab(
      BuildContext context, WidgetRef ref, InterviewsState state) {
    if (state.isLoading && state.interviews.isEmpty) {
      return const LoadingIndicator(message: 'Loading your interviews...');
    }

    if (state.errorMessage != null && state.interviews.isEmpty) {
      return ErrorView(
        error: state.errorMessage,
        onRetry: () => ref.read(interviewsProvider.notifier).loadInterviews(),
      );
    }

    final past = state.pastInterviews;

    return RefreshIndicator(
      onRefresh: () => ref.read(interviewsProvider.notifier).loadInterviews(),
      color: AppColors.primary,
      child: past.isEmpty
          ? const EmptyState(
              icon: Icons.history_rounded,
              title: 'No Past Interviews',
              message: 'Completed and previous interviews will appear here.',
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: past.length,
              itemBuilder: (context, index) {
                final interview = past[index];
                return InterviewCard(
                  interview: interview,
                  onTap: () {
                    context.push('/interviews/${interview.id}');
                  },
                );
              },
            ),
    );
  }
}
