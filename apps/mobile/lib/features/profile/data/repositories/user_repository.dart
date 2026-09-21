import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/models/enums.dart';
import '../models/update_profile_request.dart';
import '../models/user_dto.dart';

final userRepositoryProvider = Provider<UserRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return UserRepository(apiClient);
});

class UserRepository {
  final ApiClient _apiClient;

  UserRepository(this._apiClient);

  Future<UserDto?> getCurrentUser() async {
    final response = await _apiClient.get<UserDto?>(
      ApiEndpoints.currentUser,
      fromJsonT: (json) =>
          json != null ? UserDto.fromJson(json as Map<String, dynamic>) : null,
    );
    return response.data;
  }

  Future<UserDto?> updateProfile(UpdateProfileRequest request) async {
    final response = await _apiClient.put<UserDto?>(
      ApiEndpoints.updateProfile,
      data: request.toJson(),
      fromJsonT: (json) =>
          json != null ? UserDto.fromJson(json as Map<String, dynamic>) : null,
    );
    return response.data;
  }

  Future<UserDto?> setRole(UserRole role) async {
    final response = await _apiClient.put<UserDto?>(
      ApiEndpoints.updateRole,
      data: {'role': role.name.toUpperCase()},
      fromJsonT: (json) =>
          json != null ? UserDto.fromJson(json as Map<String, dynamic>) : null,
    );
    return response.data;
  }
}
