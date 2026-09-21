import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/core/network/auth_interceptor.dart';

void main() {
  group('AuthInterceptor Tests', () {
    test('Injects correlation ID on every request', () async {
      final interceptor = AuthInterceptor();
      final options = RequestOptions(path: '/api/test');
      final handler = RequestInterceptorHandler();

      interceptor.onRequest(options, handler);

      expect(options.headers['X-Correlation-ID'], isNotNull);
      expect((options.headers['X-Correlation-ID'] as String).isNotEmpty, true);
    });

    test(
        'Injects Authorization Bearer header when token getter returns a token',
        () async {
      final interceptor = AuthInterceptor(() async => 'mock-jwt-token');
      final options = RequestOptions(path: '/api/test');
      final handler = RequestInterceptorHandler();

      await interceptor.onRequest(options, handler);

      expect(options.headers['Authorization'], 'Bearer mock-jwt-token');
      expect(options.headers['X-Correlation-ID'], isNotNull);
    });

    test('Does not overwrite existing Authorization header', () async {
      final interceptor = AuthInterceptor(() async => 'new-token');
      final options = RequestOptions(
        path: '/api/test',
        headers: {'Authorization': 'Bearer existing-token'},
      );
      final handler = RequestInterceptorHandler();

      await interceptor.onRequest(options, handler);

      expect(options.headers['Authorization'], 'Bearer existing-token');
    });
  });
}
