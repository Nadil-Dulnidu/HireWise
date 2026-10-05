import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/env_config.dart';
import '../errors/app_exception.dart';
import '../../shared/models/api_response.dart';
import 'auth_interceptor.dart';
import 'error_interceptor.dart';

final tokenGetterProvider = StateProvider<TokenGetter?>((ref) => null);

final apiBaseUrlProvider = StateProvider<String>((ref) => EnvConfig.apiBaseUrl);

final dioProvider = Provider<Dio>((ref) {
  final tokenGetter = ref.watch(tokenGetterProvider);
  final baseUrl = ref.watch(apiBaseUrlProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.addAll([
    AuthInterceptor(tokenGetter),
    ErrorInterceptor(),
  ]);

  return dio;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = ref.watch(dioProvider);
  return ApiClient(dio);
});

class ApiClient {
  final Dio _dio;

  ApiClient(this._dio);

  Dio get dio => _dio;

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(Object? json) fromJsonT,
    Options? options,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return ApiResponse.fromJson(response.data ?? {}, fromJsonT);
    } on DioException catch (e) {
      if (e.error is AppException) throw e.error!;
      throw AppException(e.message ?? 'Unknown request error');
    }
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    required T Function(Object? json) fromJsonT,
    Options? options,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return ApiResponse.fromJson(response.data ?? {}, fromJsonT);
    } on DioException catch (e) {
      if (e.error is AppException) throw e.error!;
      throw AppException(e.message ?? 'Unknown request error');
    }
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    required T Function(Object? json) fromJsonT,
    Options? options,
  }) async {
    try {
      final response = await _dio.put<Map<String, dynamic>>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return ApiResponse.fromJson(response.data ?? {}, fromJsonT);
    } on DioException catch (e) {
      if (e.error is AppException) throw e.error!;
      throw AppException(e.message ?? 'Unknown request error');
    }
  }

  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    required T Function(Object? json) fromJsonT,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete<Map<String, dynamic>>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return ApiResponse.fromJson(response.data ?? {}, fromJsonT);
    } on DioException catch (e) {
      if (e.error is AppException) throw e.error!;
      throw AppException(e.message ?? 'Unknown request error');
    }
  }

  Future<ApiResponse<T>> postMultipart<T>(
    String path, {
    required FormData formData,
    required T Function(Object? json) fromJsonT,
    void Function(int sent, int total)? onSendProgress,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        path,
        data: formData,
        onSendProgress: onSendProgress,
      );
      return ApiResponse.fromJson(response.data ?? {}, fromJsonT);
    } on DioException catch (e) {
      if (e.error is AppException) throw e.error!;
      throw AppException(e.message ?? 'Unknown upload error');
    }
  }
}
