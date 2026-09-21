import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/application_dto.dart';
import '../data/models/apply_job_request.dart';
import '../data/repositories/application_repository.dart';

class ApplicationsState {
  final List<ApplicationDto> applications;
  final bool isLoading;
  final bool isLoadingMore;
  final String? errorMessage;
  final int page;
  final int totalCount;
  final bool hasNextPage;

  const ApplicationsState({
    required this.applications,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.errorMessage,
    this.page = 1,
    this.totalCount = 0,
    this.hasNextPage = false,
  });

  factory ApplicationsState.initial() => const ApplicationsState(
        applications: [],
        isLoading: true,
      );

  ApplicationsState copyWith({
    List<ApplicationDto>? applications,
    bool? isLoading,
    bool? isLoadingMore,
    String? errorMessage,
    int? page,
    int? totalCount,
    bool? hasNextPage,
  }) {
    return ApplicationsState(
      applications: applications ?? this.applications,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      errorMessage: errorMessage,
      page: page ?? this.page,
      totalCount: totalCount ?? this.totalCount,
      hasNextPage: hasNextPage ?? this.hasNextPage,
    );
  }
}

class ApplicationsNotifier extends StateNotifier<ApplicationsState> {
  final ApplicationRepository _repository;

  ApplicationsNotifier(this._repository) : super(ApplicationsState.initial()) {
    loadApplications();
  }

  Future<void> loadApplications({bool refresh = false}) async {
    state = state.copyWith(
      isLoading: true,
      page: refresh ? 1 : state.page,
      errorMessage: null,
    );

    try {
      final paged = await _repository.getMyApplications(page: 1);
      state = state.copyWith(
        applications: paged.items,
        page: 1,
        totalCount: paged.totalCount,
        hasNextPage: paged.hasNextPage,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasNextPage) return;

    final nextPage = state.page + 1;
    state = state.copyWith(isLoadingMore: true);

    try {
      final paged = await _repository.getMyApplications(page: nextPage);
      state = state.copyWith(
        applications: [...state.applications, ...paged.items],
        page: nextPage,
        totalCount: paged.totalCount,
        hasNextPage: paged.hasNextPage,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }
}

final applicationsProvider =
    StateNotifierProvider<ApplicationsNotifier, ApplicationsState>((ref) {
  final repository = ref.watch(applicationRepositoryProvider);
  return ApplicationsNotifier(repository);
});

final applicationDetailProvider =
    FutureProvider.family<ApplicationDetailDto?, String>((ref, id) async {
  final repository = ref.watch(applicationRepositoryProvider);
  return repository.getApplicationById(id);
});

final applyJobLoadingProvider = StateProvider<bool>((ref) => false);
final applyJobErrorProvider = StateProvider<String?>((ref) => null);

final applyJobControllerProvider = Provider<ApplyJobController>((ref) {
  final repository = ref.watch(applicationRepositoryProvider);
  return ApplyJobController(ref, repository);
});

class ApplyJobController {
  final Ref _ref;
  final ApplicationRepository _repository;

  ApplyJobController(this._ref, this._repository);

  Future<ApplicationDto?> apply({
    required String jobId,
    String? coverLetter,
  }) async {
    _ref.read(applyJobLoadingProvider.notifier).state = true;
    _ref.read(applyJobErrorProvider.notifier).state = null;

    try {
      final application = await _repository.applyToJob(
        jobId,
        ApplyJobRequest(coverLetter: coverLetter),
      );

      // Refresh applications list
      _ref.read(applicationsProvider.notifier).loadApplications(refresh: true);
      _ref.read(applyJobLoadingProvider.notifier).state = false;
      return application;
    } catch (e) {
      _ref.read(applyJobErrorProvider.notifier).state = e.toString();
      _ref.read(applyJobLoadingProvider.notifier).state = false;
      return null;
    }
  }
}
