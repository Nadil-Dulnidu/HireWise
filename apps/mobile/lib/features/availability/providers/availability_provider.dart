import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/availability_slot_dto.dart';
import '../data/models/create_availability_slot_request.dart';
import '../data/repositories/availability_repository.dart';

class AvailabilityState {
  final List<AvailabilitySlotDto> slots;
  final bool isLoading;
  final bool isSubmitting;
  final String? errorMessage;
  final String? successMessage;

  const AvailabilityState({
    this.slots = const [],
    this.isLoading = false,
    this.isSubmitting = false,
    this.errorMessage,
    this.successMessage,
  });

  AvailabilityState copyWith({
    List<AvailabilitySlotDto>? slots,
    bool? isLoading,
    bool? isSubmitting,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return AvailabilityState(
      slots: slots ?? this.slots,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage:
          clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }

  /// Recurring slots sorted by Monday (1) through Sunday (0)
  List<AvailabilitySlotDto> get recurringSlots {
    final list = slots.where((s) => s.isRecurring).toList();
    list.sort((a, b) {
      final aDay = a.dayOfWeek == 0 ? 7 : a.dayOfWeek;
      final bDay = b.dayOfWeek == 0 ? 7 : b.dayOfWeek;
      final dayCompare = aDay.compareTo(bDay);
      if (dayCompare != 0) return dayCompare;
      return a.startTime.compareTo(b.startTime);
    });
    return list;
  }

  /// Specific date slots
  List<AvailabilitySlotDto> get specificDateSlots {
    final list = slots.where((s) => !s.isRecurring).toList();
    list.sort((a, b) => (a.specificDate ?? '').compareTo(b.specificDate ?? ''));
    return list;
  }

  bool get hasAnySlots => slots.isNotEmpty;
}

final availabilityProvider =
    StateNotifierProvider<AvailabilityNotifier, AvailabilityState>((ref) {
  final repository = ref.watch(availabilityRepositoryProvider);
  return AvailabilityNotifier(repository);
});

class AvailabilityNotifier extends StateNotifier<AvailabilityState> {
  final AvailabilityRepository _repository;

  AvailabilityNotifier(this._repository) : super(const AvailabilityState()) {
    loadAvailability();
  }

  Future<void> loadAvailability() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final slots = await _repository.getMyAvailability();
      state = state.copyWith(slots: slots, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load availability slots: $e',
      );
    }
  }

  Future<bool> addSlot(CreateAvailabilitySlotRequest request) async {
    state = state.copyWith(
        isSubmitting: true, clearError: true, clearSuccess: true);
    try {
      final created = await _repository.createSlot(request);
      if (created != null) {
        state = state.copyWith(
          slots: [...state.slots, created],
          isSubmitting: false,
          successMessage: 'Availability slot added successfully!',
        );
        return true;
      } else {
        state = state.copyWith(
          isSubmitting: false,
          errorMessage: 'Failed to create availability slot.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Error creating slot: $e',
      );
      return false;
    }
  }

  Future<bool> addStandardWeekdaySchedule({String timezone = 'UTC'}) async {
    state = state.copyWith(
        isSubmitting: true, clearError: true, clearSuccess: true);
    try {
      final weekdaySlots = [1, 2, 3, 4, 5].map((d) {
        return CreateAvailabilitySlotRequest(
          dayOfWeek: d,
          startTime: '09:00:00',
          endTime: '17:00:00',
          timezone: timezone,
          isRecurring: true,
        );
      }).toList();

      final created = await _repository.bulkCreateSlots(weekdaySlots);
      state = state.copyWith(
        slots: [...state.slots, ...created],
        isSubmitting: false,
        successMessage: 'Standard weekday schedule (Mon–Fri, 9am–5pm) added!',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'Failed to set weekday schedule: $e',
      );
      return false;
    }
  }

  Future<bool> deleteSlot(String id) async {
    try {
      final success = await _repository.deleteSlot(id);
      if (success) {
        state = state.copyWith(
          slots: state.slots.where((s) => s.id != id).toList(),
          successMessage: 'Availability slot removed.',
        );
        return true;
      } else {
        state = state.copyWith(errorMessage: 'Failed to delete slot.');
        return false;
      }
    } catch (e) {
      state = state.copyWith(errorMessage: 'Error deleting slot: $e');
      return false;
    }
  }

  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}
