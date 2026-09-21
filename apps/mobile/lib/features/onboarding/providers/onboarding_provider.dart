import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/enums.dart';
import '../../auth/providers/auth_state_provider.dart';
import '../../profile/data/models/update_profile_request.dart';
import '../../profile/data/repositories/user_repository.dart';

final onboardingLoadingProvider = StateProvider<bool>((ref) => false);
final onboardingErrorProvider = StateProvider<String?>((ref) => null);

final onboardingControllerProvider = Provider<OnboardingController>((ref) {
  final userRepo = ref.watch(userRepositoryProvider);
  return OnboardingController(ref, userRepo);
});

class OnboardingController {
  final Ref _ref;
  final UserRepository _userRepository;

  OnboardingController(this._ref, this._userRepository);

  Future<bool> completeOnboarding({
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    _ref.read(onboardingLoadingProvider.notifier).state = true;
    _ref.read(onboardingErrorProvider.notifier).state = null;

    try {
      // 1. Ensure role is set to CANDIDATE
      await _userRepository.setRole(UserRole.candidate);

      // 2. Save profile details
      final updatedUser = await _userRepository.updateProfile(
        UpdateProfileRequest(
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim().isNotEmpty == true ? phone!.trim() : null,
        ),
      );

      if (updatedUser != null) {
        // Sync with AuthState
        _ref.read(authStateProvider.notifier).updateUser(updatedUser);
      } else {
        // Re-sync with backend
        await _ref.read(authStateProvider.notifier).syncWithBackend();
      }

      _ref.read(onboardingLoadingProvider.notifier).state = false;
      return true;
    } catch (e) {
      _ref.read(onboardingErrorProvider.notifier).state = e.toString();
      _ref.read(onboardingLoadingProvider.notifier).state = false;
      return false;
    }
  }
}
