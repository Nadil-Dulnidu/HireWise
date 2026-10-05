import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/enums.dart';
import '../../profile/data/models/user_dto.dart';
import '../../profile/data/repositories/user_repository.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthorized, // Logged in, but not CANDIDATE role
  onboarding, // Candidate in ONBOARDING status
  unauthenticated,
}

class AuthState {
  final AuthStatus status;
  final UserDto? user;
  final String? errorMessage;

  const AuthState({
    required this.status,
    this.user,
    this.errorMessage,
  });

  factory AuthState.initial() => const AuthState(status: AuthStatus.initial);
  factory AuthState.loading() => const AuthState(status: AuthStatus.loading);
  factory AuthState.authenticated(UserDto user) =>
      AuthState(status: AuthStatus.authenticated, user: user);
  factory AuthState.unauthorized(UserDto user) =>
      AuthState(status: AuthStatus.unauthorized, user: user);
  factory AuthState.onboarding(UserDto user) =>
      AuthState(status: AuthStatus.onboarding, user: user);
  factory AuthState.unauthenticated({String? error}) =>
      AuthState(status: AuthStatus.unauthenticated, errorMessage: error);

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnauthorized => status == AuthStatus.unauthorized;
  bool get isOnboarding => status == AuthStatus.onboarding;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final UserRepository _userRepository;

  AuthNotifier(this._userRepository) : super(AuthState.initial());

  Future<void> syncWithBackend() async {
    state = AuthState.loading();
    try {
      final user = await _userRepository.getCurrentUser();
      if (user == null) {
        state = AuthState.unauthenticated(error: 'User not found in system.');
        return;
      }

      // Check role - candidate app only allows CANDIDATE role
      if (user.role != UserRole.candidate) {
        state = AuthState.unauthorized(user);
        return;
      }

      // Check if onboarding is required
      if (user.status == UserStatus.onboarding) {
        state = AuthState.onboarding(user);
        return;
      }

      state = AuthState.authenticated(user);
    } catch (e) {
      state = AuthState.unauthenticated(error: e.toString());
    }
  }

  void setUnauthenticated({String? error}) {
    state = AuthState.unauthenticated(error: error);
  }

  void updateUser(UserDto user) {
    if (user.role != UserRole.candidate) {
      state = AuthState.unauthorized(user);
    } else if (user.status == UserStatus.onboarding) {
      state = AuthState.onboarding(user);
    } else {
      state = AuthState.authenticated(user);
    }
  }
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final userRepository = ref.watch(userRepositoryProvider);
  return AuthNotifier(userRepository);
});

final currentUserProvider = Provider<UserDto?>((ref) {
  return ref.watch(authStateProvider).user;
});
