import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../providers/applications_provider.dart';
import 'widgets/application_card.dart';

class ApplicationsScreen extends ConsumerStatefulWidget {
  const ApplicationsScreen({super.key});

  @override
  ConsumerState<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends ConsumerState<ApplicationsScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(applicationsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(applicationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
      ),
      body: Builder(
        builder: (context) {
          if (state.isLoading && state.applications.isEmpty) {
            return const LoadingIndicator(
                message: 'Loading your applications...');
          }

          if (state.errorMessage != null && state.applications.isEmpty) {
            return ErrorView(
              error: state.errorMessage,
              onRetry: () => ref
                  .read(applicationsProvider.notifier)
                  .loadApplications(refresh: true),
            );
          }

          if (state.applications.isEmpty) {
            return EmptyState(
              icon: Icons.assignment_outlined,
              title: 'No Applications Yet',
              message:
                  'You have not applied for any jobs yet. Explore open roles and submit your resume!',
              actionLabel: 'Browse Jobs',
              onAction: () {
                context.go('/jobs');
              },
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref
                .read(applicationsProvider.notifier)
                .loadApplications(refresh: true),
            color: AppColors.primary,
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount:
                  state.applications.length + (state.hasNextPage ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == state.applications.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  );
                }

                final app = state.applications[index];
                return ApplicationCard(
                  application: app,
                  onTap: () {
                    context.push('/applications/${app.id}');
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
