import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_state_provider.dart';
import '../data/models/update_profile_request.dart';
import '../data/repositories/user_repository.dart';

final updateProfileLoadingProvider = StateProvider<bool>((ref) => false);
final updateProfileErrorProvider = StateProvider<String?>((ref) => null);

final profileControllerProvider = Provider<ProfileController>((ref) {
  final repository = ref.watch(userRepositoryProvider);
  return ProfileController(ref, repository);
});

class ProfileController {
  final Ref _ref;
  final UserRepository _repository;

  ProfileController(this._ref, this._repository);

  Future<bool> updateProfile(UpdateProfileRequest request) async {
    _ref.read(updateProfileLoadingProvider.notifier).state = true;
    _ref.read(updateProfileErrorProvider.notifier).state = null;

    try {
      final updated = await _repository.updateProfile(request);
      if (updated != null) {
        _ref.read(authStateProvider.notifier).updateUser(updated);
      }
      _ref.read(updateProfileLoadingProvider.notifier).state = false;
      return true;
    } catch (e) {
      _ref.read(updateProfileErrorProvider.notifier).state = e.toString();
      _ref.read(updateProfileLoadingProvider.notifier).state = false;
      return false;
    }
  }
}
