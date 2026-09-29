import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../models/resume_dto.dart';

final resumeRepositoryProvider = Provider<ResumeRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ResumeRepository(apiClient);
});

// Repository handling resume network requests and data operations
class ResumeRepository {
  final ApiClient _apiClient;

  ResumeRepository(this._apiClient);

  // Fetch the active resume of the authenticated candidate
  Future<ResumeDto?> getActiveResume() async {
    try {
      final response = await _apiClient.get<ResumeDto?>(
        ApiEndpoints.myResume,
        fromJsonT: (json) => json != null
            ? ResumeDto.fromJson(json as Map<String, dynamic>)
            : null,
      );
      return response.data;
    } catch (_) {
      // If 404 / no active resume found, return null
      return null;
    }
  }

  // Fetch a specific resume by its ID
  Future<ResumeDto?> getResumeById(String id) async {
    final response = await _apiClient.get<ResumeDto?>(
      ApiEndpoints.resumeById(id),
      fromJsonT: (json) => json != null
          ? ResumeDto.fromJson(json as Map<String, dynamic>)
          : null,
    );
    return response.data;
  }

  // Upload a resume file using multipart form data with progress tracking
  Future<bool> uploadResume(
    String filePath,
    String fileName, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        filePath,
        filename: fileName,
      ),
    });

    final response = await _apiClient.postMultipart<Map<String, dynamic>>(
      ApiEndpoints.uploadResume,
      formData: formData,
      onSendProgress: onProgress,
      fromJsonT: (json) => (json as Map<String, dynamic>?) ?? {},
    );

    return response.success;
  }

  // Delete a resume by ID from the server
  Future<bool> deleteResume(String id) async {
    final response = await _apiClient.delete<bool>(
      ApiEndpoints.resumeById(id),
      fromJsonT: (json) => json as bool? ?? true,
    );
    return response.success;
  }
}
