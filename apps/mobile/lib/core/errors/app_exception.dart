class AppException implements Exception {
  final String message;
  final int? statusCode;
  final String? correlationId;
  final dynamic details;

  const AppException(
    this.message, {
    this.statusCode,
    this.correlationId,
    this.details,
  });

  @override
  String toString() => message;
}

class UnauthorizedException extends AppException {
  const UnauthorizedException([
    super.message = 'Session expired or unauthenticated. Please sign in again.',
    String? correlationId,
  ]) : super(statusCode: 401, correlationId: correlationId);
}

class ForbiddenException extends AppException {
  const ForbiddenException([
    super.message =
        'Access denied. You do not have permission to perform this action.',
    String? correlationId,
  ]) : super(statusCode: 403, correlationId: correlationId);
}

class NotFoundException extends AppException {
  const NotFoundException([
    super.message = 'The requested resource was not found.',
    String? correlationId,
  ]) : super(statusCode: 404, correlationId: correlationId);
}

class ConflictException extends AppException {
  const ConflictException([
    super.message =
        'A conflict occurred. For example, you may have already applied for this job.',
    String? correlationId,
  ]) : super(statusCode: 409, correlationId: correlationId);
}

class ValidationException extends AppException {
  final Map<String, List<String>> errors;

  ValidationException(
    super.message, {
    this.errors = const {},
    super.correlationId,
  }) : super(statusCode: 422, details: errors);
}

class RateLimitException extends AppException {
  const RateLimitException([
    super.message =
        'Too many requests. Please slow down and try again shortly.',
    String? correlationId,
  ]) : super(statusCode: 429, correlationId: correlationId);
}

class ServerException extends AppException {
  const ServerException([
    super.message =
        'An unexpected server error occurred. Please try again later.',
    int? statusCode = 500,
    String? correlationId,
  ]) : super(statusCode: statusCode, correlationId: correlationId);
}

class NetworkException extends AppException {
  const NetworkException([
    super.message =
        'Unable to connect to server. Please check your internet connection.',
  ]);
}
