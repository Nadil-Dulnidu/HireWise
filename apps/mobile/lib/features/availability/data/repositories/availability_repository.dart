import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../models/availability_slot_dto.dart';
import '../models/create_availability_slot_request.dart';

final availabilityRepositoryProvider = Provider<AvailabilityRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AvailabilityRepository(apiClient);
});

class AvailabilityRepository {
  final ApiClient _apiClient;

  AvailabilityRepository(this._apiClient);

  Future<List<AvailabilitySlotDto>> getMyAvailability() async {
    final response = await _apiClient.get<List<AvailabilitySlotDto>>(
      ApiEndpoints.myAvailability,
      fromJsonT: (json) {
        if (json is List) {
          return json
              .map((item) =>
                  AvailabilitySlotDto.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return <AvailabilitySlotDto>[];
      },
    );
    return response.data ?? [];
  }

  Future<AvailabilitySlotDto?> createSlot(
      CreateAvailabilitySlotRequest request) async {
    final response = await _apiClient.post<AvailabilitySlotDto?>(
      ApiEndpoints.availability,
      data: request.toJson(),
      fromJsonT: (json) => json != null && json is Map<String, dynamic>
          ? AvailabilitySlotDto.fromJson(json)
          : null,
    );
    return response.data;
  }

  Future<List<AvailabilitySlotDto>> bulkCreateSlots(
      List<CreateAvailabilitySlotRequest> slots) async {
    final response = await _apiClient.post<List<AvailabilitySlotDto>>(
      ApiEndpoints.availabilityBulk,
      data: {'slots': slots.map((s) => s.toJson()).toList()},
      fromJsonT: (json) {
        if (json is List) {
          return json
              .map((item) =>
                  AvailabilitySlotDto.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return <AvailabilitySlotDto>[];
      },
    );
    return response.data ?? [];
  }

  Future<bool> deleteSlot(String id) async {
    final response = await _apiClient.delete<dynamic>(
      ApiEndpoints.availabilityById(id),
      fromJsonT: (json) => json,
    );
    return response.success;
  }
}
