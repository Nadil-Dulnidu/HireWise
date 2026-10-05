import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/resume_dto.dart';
import '../data/repositories/resume_repository.dart';

// State model representing active resume details, upload progress, and loading indicators
class ResumeState {
  final ResumeDto? activeResume;
  final bool isLoading;
  final bool isUploading;
  final double uploadProgress;
  final String? errorMessage;

  const ResumeState({
    this.activeResume,
    this.isLoading = false,
    this.isUploading = false,
    this.uploadProgress = 0.0,
    this.errorMessage,
  });

  factory ResumeState.initial() => const ResumeState(isLoading: true);

  ResumeState copyWith({
    ResumeDto? activeResume,
    bool clearResume = false,
    bool? isLoading,
    bool? isUploading,
    double? uploadProgress,
    String? errorMessage,
  }) {
    return ResumeState(
      activeResume: clearResume ? null : (activeResume ?? this.activeResume),
      isLoading: isLoading ?? this.isLoading,
      isUploading: isUploading ?? this.isUploading,
      uploadProgress: uploadProgress ?? this.uploadProgress,
      errorMessage: errorMessage,
    );
  }
}

// Notifier managing resume state, uploads, downloads, and deletions
class ResumeNotifier extends StateNotifier<ResumeState> {
  final ResumeRepository _repository;

  ResumeNotifier(this._repository) : super(ResumeState.initial()) {
    loadActiveResume();
  }

  // Fetch and update state with the candidate's active resume
  Future<void> loadActiveResume() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final resume = await _repository.getActiveResume();
      state = state.copyWith(
        activeResume: resume,
        isLoading: false,
        clearResume: resume == null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  // Upload a resume file with progress tracking and refresh the active resume
  Future<bool> uploadResume(String filePath, String fileName) async {
    state = state.copyWith(
      isUploading: true,
      uploadProgress: 0.0,
      errorMessage: null,
    );

    try {
      final success = await _repository.uploadResume(
        filePath,
        fileName,
        onProgress: (sent, total) {
          if (total > 0) {
            state = state.copyWith(uploadProgress: sent / total);
          }
        },
      );

      if (success) {
        await loadActiveResume();
      }

      state = state.copyWith(isUploading: false, uploadProgress: 1.0);
      return success;
    } catch (e) {
      state = state.copyWith(
        isUploading: false,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  // Delete a resume by ID and clear active resume state
  Future<bool> deleteResume(String id) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final success = await _repository.deleteResume(id);
      if (success) {
        state = state.copyWith(isLoading: false, clearResume: true);
      } else {
        state = state.copyWith(isLoading: false);
      }
      return success;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }
}

final resumeProvider =
    StateNotifierProvider<ResumeNotifier, ResumeState>((ref) {
  final repository = ref.watch(resumeRepositoryProvider);
  return ResumeNotifier(repository);
});
