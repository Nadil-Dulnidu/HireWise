import 'package:dio/dio.dart';
import 'app_exception.dart';

class ErrorHandler {
  ErrorHandler._();

  static String getUserMessage(dynamic error) {
    if (error is AppException) {
      if (error is ValidationException && error.errors.isNotEmpty) {
        final messages =
            error.errors.values.expand((element) => element).toList();
        if (messages.isNotEmpty) {
          return messages.join('\n');
        }
      }
      return error.message;
    }

    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please check your network connection and try again.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final responseData = error.response?.data;
          if (responseData is Map<String, dynamic>) {
            final serverMsg = responseData['error'] ?? responseData['message'];
            if (serverMsg is String && serverMsg.isNotEmpty) {
              return serverMsg;
            }
          }
          if (statusCode == 401) {
            return 'Session expired. Please sign in again.';
          }
          if (statusCode == 403) {
            return 'You are not authorized to view this resource.';
          }
          if (statusCode == 404) {
            return 'The requested resource could not be found.';
          }
          if (statusCode == 409) {
            return 'A conflict occurred with this request.';
          }
          if (statusCode != null && statusCode >= 500) {
            return 'Server error ($statusCode). Please try again later.';
          }
          return 'Request failed (${statusCode ?? 'unknown'}).';
        case DioExceptionType.connectionError:
          return 'Unable to reach the server. Please verify your connection.';
        case DioExceptionType.cancel:
          return 'Request was cancelled.';
        case DioExceptionType.unknown:
        default:
          return 'An unexpected network error occurred. Please try again.';
      }
    }

    return error?.toString() ?? 'An unexpected error occurred.';
  }
}
