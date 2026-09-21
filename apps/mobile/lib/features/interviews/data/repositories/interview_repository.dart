import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/models/paged_result.dart';
import '../models/interview_detail_dto.dart';
import '../models/interview_dto.dart';

final interviewRepositoryProvider = Provider<InterviewRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return InterviewRepository(apiClient);
});

class InterviewRepository {
  final ApiClient _apiClient;

  InterviewRepository(this._apiClient);

  Future<PagedResult<InterviewDto>> getMyInterviews({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (search != null && search.isNotEmpty) query['search'] = search;

    final response = await _apiClient.get<PagedResult<InterviewDto>>(
      ApiEndpoints.myInterviews,
      queryParameters: query,
      fromJsonT: (json) {
        if (json is Map<String, dynamic>) {
          return PagedResult<InterviewDto>.fromJson(
            json,
            (item) => InterviewDto.fromJson(item as Map<String, dynamic>),
          );
        }
        return PagedResult<InterviewDto>.empty();
      },
    );
    return response.data ?? PagedResult<InterviewDto>.empty();
  }

  Future<InterviewDetailDto?> getInterviewById(String id) async {
    final response = await _apiClient.get<InterviewDetailDto?>(
      ApiEndpoints.interviewById(id),
      fromJsonT: (json) => json != null
          ? InterviewDetailDto.fromJson(json as Map<String, dynamic>)
          : null,
    );
    return response.data;
  }
}
