import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/core/errors/app_exception.dart';
import 'package:hirewise_mobile/core/errors/error_handler.dart';

void main() {
  group('ErrorHandler Tests', () {
    test('Formats AppException message correctly', () {
      const exception = UnauthorizedException('Custom unauthorized message');
      final msg = ErrorHandler.getUserMessage(exception);
      expect(msg, 'Custom unauthorized message');
    });

    test('Formats ValidationException with field errors', () {
      final exception = ValidationException(
        'Validation failed',
        errors: {
          'FirstName': ['First name is required.'],
          'Email': ['Invalid email format.'],
        },
      );
      final msg = ErrorHandler.getUserMessage(exception);
      expect(msg.contains('First name is required.'), true);
      expect(msg.contains('Invalid email format.'), true);
    });

    test('Formats Dio connection timeout error', () {
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/api/test'),
        type: DioExceptionType.connectionTimeout,
      );
      final msg = ErrorHandler.getUserMessage(dioError);
      expect(msg.contains('Connection timed out'), true);
    });

    test('Formats Dio bad response with server error message', () {
      final dioError = DioException(
        requestOptions: RequestOptions(path: '/api/test'),
        type: DioExceptionType.badResponse,
        response: Response(
          requestOptions: RequestOptions(path: '/api/test'),
          statusCode: 409,
          data: {'error': 'You have already applied for this job.'},
        ),
      );
      final msg = ErrorHandler.getUserMessage(dioError);
      expect(msg, 'You have already applied for this job.');
    });
  });
}
