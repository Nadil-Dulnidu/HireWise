import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

typedef TokenGetter = Future<String?> Function();

class AuthInterceptor extends Interceptor {
  final TokenGetter? _tokenGetter;
  static const _uuid = Uuid();

  AuthInterceptor([this._tokenGetter]);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Add unique correlation ID for every request
    if (!options.headers.containsKey('X-Correlation-ID')) {
      options.headers['X-Correlation-ID'] = _uuid.v4();
    }

    // Add authorization header if token is available
    if (_tokenGetter != null && !options.headers.containsKey('Authorization')) {
      try {
        final token = await _tokenGetter();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
      } catch (_) {
        // Fallthrough if token getter fails; request will proceed unauthenticated
      }
    }

    handler.next(options);
  }
}
