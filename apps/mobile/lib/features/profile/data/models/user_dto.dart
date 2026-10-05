import '../../../../shared/models/enums.dart';

// User profile data transfer object for mobile client
class UserDto {
  final String id;
  final String clerkUserId;
  final String email;
  final String firstName;
  final String lastName;
  final String fullName;
  final UserRole role;
  final UserStatus status;
  final String? companyId;
  final String? companyName;
  final String? profileImageUrl;
  final String? phone;
  final DateTime createdAt;

  // Constructor initializing all user profile fields
  const UserDto({
    required this.id,
    required this.clerkUserId,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.role,
    required this.status,
    this.companyId,
    this.companyName,
    this.profileImageUrl,
    this.phone,
    required this.createdAt,
  });

  // Parse user profile from backend JSON response
  factory UserDto.fromJson(Map<String, dynamic> json) {
    final roleStr = json['role'] as String? ?? 'CANDIDATE';
    final statusStr = json['status'] as String? ?? 'ACTIVE';

    final role = UserRole.values.firstWhere(
      (r) => r.name.toUpperCase() == roleStr.toUpperCase(),
      orElse: () => UserRole.candidate,
    );

    final status = UserStatus.values.firstWhere(
      (s) => s.name.toUpperCase() == statusStr.toUpperCase(),
      orElse: () => UserStatus.active,
    );

    return UserDto(
      id: json['id'] as String? ?? '',
      clerkUserId: json['clerkUserId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      fullName: json['fullName'] as String? ??
          '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim(),
      role: role,
      status: status,
      companyId: json['companyId'] as String?,
      companyName: json['companyName'] as String?,
      profileImageUrl: json['profileImageUrl'] as String?,
      phone: json['phone'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  // Convert user profile into JSON map
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clerkUserId': clerkUserId,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'fullName': fullName,
      'role': role.name.toUpperCase(),
      'status': status.name.toUpperCase(),
      'companyId': companyId,
      'companyName': companyName,
      'profileImageUrl': profileImageUrl,
      'phone': phone,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Convenience getters for role and onboarding status
  bool get isCandidate => role == UserRole.candidate;
  bool get isOnboarding => status == UserStatus.onboarding;
}
