import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../models/dashboard_data.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DashboardRepository(apiClient);
});

class DashboardRepository {
  final ApiClient _apiClient;

  DashboardRepository(this._apiClient);

  Future<DashboardData?> getDashboardData() async {
    final response = await _apiClient.get<DashboardData?>(
      ApiEndpoints.candidateDashboard,
      fromJsonT: (json) => json != null
          ? DashboardData.fromJson(json as Map<String, dynamic>)
          : null,
    );
    return response.data;
  }
}
