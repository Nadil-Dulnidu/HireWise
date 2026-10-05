import 'package:dio/dio.dart';
import '../errors/app_exception.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final correlationId =
        err.requestOptions.headers['X-Correlation-ID'] as String?;

    AppException appException;

    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        appException = const NetworkException();
        break;

      case DioExceptionType.badResponse:
        final statusCode = err.response?.statusCode;
        final data = err.response?.data;
        String message = 'An error occurred';
        Map<String, List<String>> validationErrors = {};

        if (data is Map<String, dynamic>) {
          if (data['error'] is String && (data['error'] as String).isNotEmpty) {
            message = data['error'] as String;
          } else if (data['message'] is String &&
              (data['message'] as String).isNotEmpty) {
            message = data['message'] as String;
          }

          if (data['errors'] is Map<String, dynamic>) {
            final rawErrors = data['errors'] as Map<String, dynamic>;
            rawErrors.forEach((key, value) {
              if (value is List) {
                validationErrors[key] = value.map((e) => e.toString()).toList();
              } else if (value is String) {
                validationErrors[key] = [value];
              }
            });
          }
        }

        switch (statusCode) {
          case 401:
            appException = UnauthorizedException(
              message.isNotEmpty ? message : 'Session expired.',
              correlationId,
            );
            break;
          case 403:
            appException = ForbiddenException(
              message.isNotEmpty ? message : 'Access denied.',
              correlationId,
            );
            break;
          case 404:
            appException = NotFoundException(
              message.isNotEmpty ? message : 'Resource not found.',
              correlationId,
            );
            break;
          case 409:
            appException = ConflictException(
              message.isNotEmpty ? message : 'A conflict occurred.',
              correlationId,
            );
            break;
          case 422:
            appException = ValidationException(
              message.isNotEmpty ? message : 'Validation failed.',
              errors: validationErrors,
              correlationId: correlationId,
            );
            break;
          case 429:
            appException = RateLimitException(
              message.isNotEmpty ? message : 'Rate limit exceeded.',
              correlationId,
            );
            break;
          default:
            appException = ServerException(
              message.isNotEmpty ? message : 'Server error ($statusCode).',
              statusCode,
              correlationId,
            );
            break;
        }
        break;

      case DioExceptionType.cancel:
        appException = const AppException('Request was cancelled.');
        break;

      default:
        appException = const NetworkException();
        break;
    }

    final newError = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: appException,
    );

    handler.next(newError);
  }
}
