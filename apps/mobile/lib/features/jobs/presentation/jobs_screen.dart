import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../providers/jobs_provider.dart';
import 'widgets/job_card.dart';
import 'widgets/job_filter_sheet.dart';

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({super.key});

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(jobsProvider.notifier).loadMore();
    }
  }

  void _showFilterSheet() {
    final currentFilter = ref.read(jobsProvider).filter;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => JobFilterSheet(
        initialFilter: currentFilter,
        onApply: (newFilter) {
          ref.read(jobsProvider.notifier).updateFilter(newFilter);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(jobsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse Jobs'),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.tune_rounded),
                tooltip: 'Filter jobs',
                onPressed: _showFilterSheet,
              ),
              if (state.filter.hasActiveFilters)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search jobs, skills, or companies...',
                prefixIcon:
                    const Icon(Icons.search_rounded, color: AppColors.slate400),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(jobsProvider.notifier).setSearch('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
              onSubmitted: (query) {
                ref.read(jobsProvider.notifier).setSearch(query);
              },
            ),
          ),

          // Job list or states
          Expanded(
            child: Builder(
              builder: (context) {
                if (state.isLoading && state.jobs.isEmpty) {
                  return const LoadingIndicator(
                      message: 'Finding opportunities...');
                }

                if (state.errorMessage != null && state.jobs.isEmpty) {
                  return ErrorView(
                    error: state.errorMessage,
                    onRetry: () =>
                        ref.read(jobsProvider.notifier).loadJobs(refresh: true),
                  );
                }

                if (state.jobs.isEmpty) {
                  return EmptyState(
                    icon: Icons.search_off_rounded,
                    title: 'No Jobs Found',
                    message: state.filter.hasActiveFilters
                        ? 'Try clearing your filters or changing your search terms.'
                        : 'There are currently no open positions listed.',
                    actionLabel:
                        state.filter.hasActiveFilters ? 'Reset Filters' : null,
                    onAction: state.filter.hasActiveFilters
                        ? () {
                            _searchController.clear();
                            ref.read(jobsProvider.notifier).updateFilter(
                                  state.filter.copyWith(
                                    search: '',
                                    clearEmploymentType: true,
                                    clearExperienceLevel: true,
                                    minSalary: null,
                                    maxSalary: null,
                                  ),
                                );
                          }
                        : null,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () =>
                      ref.read(jobsProvider.notifier).loadJobs(refresh: true),
                  color: AppColors.primary,
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: state.jobs.length + (state.hasNextPage ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == state.jobs.length) {
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

                      final job = state.jobs[index];
                      return JobCard(
                        job: job,
                        onTap: () {
                          context.push('/jobs/${job.id}');
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
