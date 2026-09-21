class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final String? error;
  final DateTime? timestamp;
  final String? correlationId;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
    this.timestamp,
    this.correlationId,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] as bool? ?? false,
      data: json['data'] != null ? fromJsonT(json['data']) : null,
      message: json['message'] as String?,
      error: json['error'] as String?,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'] as String)
          : null,
      correlationId: json['correlationId'] as String?,
    );
  }

  factory ApiResponse.success(T data,
      {String? message, String? correlationId}) {
    return ApiResponse<T>(
      success: true,
      data: data,
      message: message,
      correlationId: correlationId,
      timestamp: DateTime.now(),
    );
  }

  factory ApiResponse.failure(String error, {String? correlationId}) {
    return ApiResponse<T>(
      success: false,
      error: error,
      correlationId: correlationId,
      timestamp: DateTime.now(),
    );
  }
}
