import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/models/paged_result.dart';
import '../models/application_dto.dart';
import '../models/apply_job_request.dart';

final applicationRepositoryProvider = Provider<ApplicationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ApplicationRepository(apiClient);
});

class ApplicationRepository {
  final ApiClient _apiClient;

  ApplicationRepository(this._apiClient);

  Future<ApplicationDto?> applyToJob(
    String jobId,
    ApplyJobRequest request,
  ) async {
    final response = await _apiClient.post<ApplicationDto?>(
      ApiEndpoints.applyToJob(jobId),
      data: request.toJson(),
      fromJsonT: (json) => json != null
          ? ApplicationDto.fromJson(json as Map<String, dynamic>)
          : null,
    );
    return response.data;
  }

  Future<PagedResult<ApplicationDto>> getMyApplications({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (search != null && search.isNotEmpty) query['search'] = search;

    final response = await _apiClient.get<PagedResult<ApplicationDto>>(
      ApiEndpoints.myApplications,
      queryParameters: query,
      fromJsonT: (json) {
        if (json is Map<String, dynamic>) {
          return PagedResult<ApplicationDto>.fromJson(
            json,
            (item) => ApplicationDto.fromJson(item as Map<String, dynamic>),
          );
        }
        return PagedResult<ApplicationDto>.empty();
      },
    );
    return response.data ?? PagedResult<ApplicationDto>.empty();
  }

  Future<ApplicationDetailDto?> getApplicationById(String id) async {
    final response = await _apiClient.get<ApplicationDetailDto?>(
      ApiEndpoints.applicationById(id),
      fromJsonT: (json) => json != null
          ? ApplicationDetailDto.fromJson(json as Map<String, dynamic>)
          : null,
    );
    return response.data;
  }
}
