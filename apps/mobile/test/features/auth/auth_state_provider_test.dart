import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/auth/providers/auth_state_provider.dart';
import 'package:hirewise_mobile/features/profile/data/models/user_dto.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('AuthState Tests', () {
    final candidateUser = UserDto(
      id: 'c1',
      clerkUserId: 'clerk_c1',
      email: 'cand@test.com',
      firstName: 'Cand',
      lastName: 'Idate',
      fullName: 'Cand Idate',
      role: UserRole.candidate,
      status: UserStatus.active,
      createdAt: DateTime.now(),
    );

    final onboardingUser = UserDto(
      id: 'c2',
      clerkUserId: 'clerk_c2',
      email: 'onboard@test.com',
      firstName: 'On',
      lastName: 'Boarding',
      fullName: 'On Boarding',
      role: UserRole.candidate,
      status: UserStatus.onboarding,
      createdAt: DateTime.now(),
    );

    final recruiterUser = UserDto(
      id: 'r1',
      clerkUserId: 'clerk_r1',
      email: 'recruiter@test.com',
      firstName: 'Rec',
      lastName: 'Ruiter',
      fullName: 'Rec Ruiter',
      role: UserRole.recruiter,
      status: UserStatus.active,
      createdAt: DateTime.now(),
    );

    test('Initial state is initial', () {
      final state = AuthState.initial();
      expect(state.status, AuthStatus.initial);
      expect(state.isAuthenticated, false);
    });

    test('Authenticated state is authenticated', () {
      final state = AuthState.authenticated(candidateUser);
      expect(state.status, AuthStatus.authenticated);
      expect(state.isAuthenticated, true);
      expect(state.user?.id, 'c1');
    });

    test('Unauthorized state for non-candidate', () {
      final state = AuthState.unauthorized(recruiterUser);
      expect(state.status, AuthStatus.unauthorized);
      expect(state.isUnauthorized, true);
      expect(state.user?.role, UserRole.recruiter);
    });

    test('Onboarding state for candidate needing setup', () {
      final state = AuthState.onboarding(onboardingUser);
      expect(state.status, AuthStatus.onboarding);
      expect(state.isOnboarding, true);
      expect(state.user?.status, UserStatus.onboarding);
    });
  });
}
