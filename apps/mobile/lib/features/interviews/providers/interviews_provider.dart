import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/models/enums.dart';
import '../data/models/interview_detail_dto.dart';
import '../data/models/interview_dto.dart';
import '../data/repositories/interview_repository.dart';

class InterviewsState {
  final List<InterviewDto> interviews;
  final bool isLoading;
  final String? errorMessage;

  const InterviewsState({
    required this.interviews,
    this.isLoading = false,
    this.errorMessage,
  });

  factory InterviewsState.initial() => const InterviewsState(
        interviews: [],
        isLoading: true,
      );

  List<InterviewDto> get upcomingInterviews {
    final now = DateTime.now();
    return interviews.where((i) {
      final isFuture = i.scheduledStartTime.isAfter(now);
      final isScheduled = i.status == InterviewStatus.scheduled ||
          i.status == InterviewStatus.inProgress;
      return isFuture && isScheduled;
    }).toList()
      ..sort((a, b) => a.scheduledStartTime.compareTo(b.scheduledStartTime));
  }

  List<InterviewDto> get pastInterviews {
    final now = DateTime.now();
    return interviews.where((i) {
      final isPast = i.scheduledStartTime.isBefore(now);
      final isNotScheduled = i.status != InterviewStatus.scheduled &&
          i.status != InterviewStatus.inProgress;
      return isPast || isNotScheduled;
    }).toList()
      ..sort((a, b) => b.scheduledStartTime.compareTo(a.scheduledStartTime));
  }

  InterviewsState copyWith({
    List<InterviewDto>? interviews,
    bool? isLoading,
    String? errorMessage,
  }) {
    return InterviewsState(
      interviews: interviews ?? this.interviews,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class InterviewsNotifier extends StateNotifier<InterviewsState> {
  final InterviewRepository _repository;

  InterviewsNotifier(this._repository) : super(InterviewsState.initial()) {
    loadInterviews();
  }

  Future<void> loadInterviews() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final paged = await _repository.getMyInterviews(pageSize: 50);
      state = state.copyWith(
        interviews: paged.items,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }
}

final interviewsProvider =
    StateNotifierProvider<InterviewsNotifier, InterviewsState>((ref) {
  final repository = ref.watch(interviewRepositoryProvider);
  return InterviewsNotifier(repository);
});

final interviewDetailProvider =
    FutureProvider.family<InterviewDetailDto?, String>((ref, id) async {
  final repository = ref.watch(interviewRepositoryProvider);
  return repository.getInterviewById(id);
});
