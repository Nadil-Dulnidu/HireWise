import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/job_dto.dart';
import '../data/models/job_filter_request.dart';
import '../data/models/job_summary_dto.dart';
import '../data/repositories/job_repository.dart';

class JobsState {
  final List<JobSummaryDto> jobs;
  final JobFilterRequest filter;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;
  final int totalCount;
  final bool hasNextPage;

  const JobsState({
    required this.jobs,
    required this.filter,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
    this.totalCount = 0,
    this.hasNextPage = false,
  });

  factory JobsState.initial() => const JobsState(
        jobs: [],
        filter: JobFilterRequest(),
        isLoading: true,
      );

  JobsState copyWith({
    List<JobSummaryDto>? jobs,
    JobFilterRequest? filter,
    bool? isLoading,
    bool? isLoadingMore,
    String? errorMessage,
    int? totalCount,
    bool? hasNextPage,
  }) {
    return JobsState(
      jobs: jobs ?? this.jobs,
      filter: filter ?? this.filter,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      errorMessage: errorMessage,
      totalCount: totalCount ?? this.totalCount,
      hasNextPage: hasNextPage ?? this.hasNextPage,
    );
  }
}

class JobsNotifier extends StateNotifier<JobsState> {
  final JobRepository _repository;

  JobsNotifier(this._repository) : super(JobsState.initial()) {
    loadJobs();
  }

  Future<void> loadJobs({bool refresh = false}) async {
    final currentFilter =
        refresh ? state.filter.copyWith(page: 1) : state.filter;

    state = state.copyWith(
      isLoading: true,
      filter: currentFilter,
      errorMessage: null,
    );

    try {
      final paged = await _repository.getJobs(currentFilter);
      state = state.copyWith(
        jobs: paged.items,
        totalCount: paged.totalCount,
        hasNextPage: paged.hasNextPage,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasNextPage) return;

    final nextPage = state.filter.page + 1;
    final nextFilter = state.filter.copyWith(page: nextPage);

    state = state.copyWith(isLoadingMore: true);

    try {
      final paged = await _repository.getJobs(nextFilter);
      state = state.copyWith(
        jobs: [...state.jobs, ...paged.items],
        filter: nextFilter,
        totalCount: paged.totalCount,
        hasNextPage: paged.hasNextPage,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void updateFilter(JobFilterRequest newFilter) {
    state = state.copyWith(filter: newFilter.copyWith(page: 1));
    loadJobs();
  }

  void setSearch(String query) {
    state =
        state.copyWith(filter: state.filter.copyWith(search: query, page: 1));
    loadJobs();
  }
}

final jobsProvider = StateNotifierProvider<JobsNotifier, JobsState>((ref) {
  final repository = ref.watch(jobRepositoryProvider);
  return JobsNotifier(repository);
});

final jobDetailProvider =
    FutureProvider.family<JobDto?, String>((ref, id) async {
  final repository = ref.watch(jobRepositoryProvider);
  return repository.getJobById(id);
});
