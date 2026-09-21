import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/profile/data/models/update_profile_request.dart';
import 'package:hirewise_mobile/features/profile/data/models/user_dto.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('User Models Tests', () {
    test('UserDto parses candidate user JSON', () {
      final json = {
        'id': 'usr-1',
        'clerkUserId': 'user_clerk_123',
        'email': 'candidate@hirewise.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'role': 'CANDIDATE',
        'status': 'ACTIVE',
        'phone': '+1 (555) 123-4567',
        'createdAt': '2026-08-01T12:00:00Z',
      };

      final dto = UserDto.fromJson(json);

      expect(dto.id, 'usr-1');
      expect(dto.clerkUserId, 'user_clerk_123');
      expect(dto.fullName, 'John Doe');
      expect(dto.role, UserRole.candidate);
      expect(dto.status, UserStatus.active);
      expect(dto.isCandidate, true);
      expect(dto.isOnboarding, false);
    });

    test('UserDto detects onboarding status', () {
      final json = {
        'id': 'usr-2',
        'clerkUserId': 'user_clerk_456',
        'email': 'new@hirewise.com',
        'firstName': 'New',
        'lastName': 'User',
        'role': 'CANDIDATE',
        'status': 'ONBOARDING',
        'createdAt': '2026-08-01T12:00:00Z',
      };

      final dto = UserDto.fromJson(json);
      expect(dto.isOnboarding, true);
    });

    test('UpdateProfileRequest serialization', () {
      const req = UpdateProfileRequest(
        firstName: 'John',
        lastName: 'Smith',
        phone: '1234567890',
      );

      final json = req.toJson();
      expect(json['firstName'], 'John');
      expect(json['lastName'], 'Smith');
      expect(json['phone'], '1234567890');
      expect(json.containsKey('profileImageUrl'), false);
    });
  });
}
