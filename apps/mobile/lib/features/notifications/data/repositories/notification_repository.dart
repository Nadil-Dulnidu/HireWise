import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../models/notification_dto.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationRepository(apiClient);
});

class NotificationRepository {
  final ApiClient _apiClient;

  NotificationRepository(this._apiClient);

  Future<List<NotificationDto>> getNotifications({int limit = 50}) async {
    final response = await _apiClient.get<List<NotificationDto>>(
      ApiEndpoints.notifications,
      queryParameters: {'limit': limit},
      fromJsonT: (json) {
        if (json is List) {
          return json
              .map((item) =>
                  NotificationDto.fromJson(item as Map<String, dynamic>))
              .toList();
        }
        return [];
      },
    );
    return response.data ?? [];
  }

  Future<int> getUnreadCount() async {
    final response = await _apiClient.get<int>(
      ApiEndpoints.unreadNotificationsCount,
      fromJsonT: (json) => json as int? ?? 0,
    );
    return response.data ?? 0;
  }

  Future<bool> markAsRead(String id) async {
    final response = await _apiClient.put<bool>(
      ApiEndpoints.markNotificationRead(id),
      fromJsonT: (json) => json as bool? ?? true,
    );
    return response.success;
  }

  Future<bool> markAllAsRead() async {
    final response = await _apiClient.put<bool>(
      ApiEndpoints.markAllNotificationsRead,
      fromJsonT: (json) => json as bool? ?? true,
    );
    return response.success;
  }
}
