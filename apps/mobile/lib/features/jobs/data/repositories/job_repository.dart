import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/models/paged_result.dart';
import '../models/job_dto.dart';
import '../models/job_filter_request.dart';
import '../models/job_summary_dto.dart';

final jobRepositoryProvider = Provider<JobRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return JobRepository(apiClient);
});

class JobRepository {
  final ApiClient _apiClient;

  JobRepository(this._apiClient);

  Future<PagedResult<JobSummaryDto>> getJobs(JobFilterRequest request) async {
    final queryParams = Map<String, dynamic>.from(request.toQueryParameters())
      ..putIfAbsent('publicOnly', () => true);
    final response = await _apiClient.get<PagedResult<JobSummaryDto>>(
      ApiEndpoints.jobs,
      queryParameters: queryParams,
      fromJsonT: (json) {
        if (json is Map<String, dynamic>) {
          return PagedResult<JobSummaryDto>.fromJson(
            json,
            (item) => JobSummaryDto.fromJson(item as Map<String, dynamic>),
          );
        }
        return PagedResult<JobSummaryDto>.empty();
      },
    );
    return response.data ?? PagedResult<JobSummaryDto>.empty();
  }

  Future<JobDto?> getJobById(String id) async {
    final response = await _apiClient.get<JobDto?>(
      ApiEndpoints.jobById(id),
      fromJsonT: (json) =>
          json != null ? JobDto.fromJson(json as Map<String, dynamic>) : null,
    );
    return response.data;
  }
}
