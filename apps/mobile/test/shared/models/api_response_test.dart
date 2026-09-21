import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/shared/models/api_response.dart';
import 'package:hirewise_mobile/shared/models/paged_result.dart';

void main() {
  group('ApiResponse & PagedResult Tests', () {
    test('ApiResponse parses successful response', () {
      final json = {
        'success': true,
        'data': {'id': '123', 'name': 'Test'},
        'message': 'Loaded',
        'error': null,
        'timestamp': '2026-09-21T10:00:00Z',
        'correlationId': 'corr-abc',
      };

      final response = ApiResponse.fromJson(
        json,
        (data) => (data as Map<String, dynamic>)['name'] as String,
      );

      expect(response.success, true);
      expect(response.data, 'Test');
      expect(response.message, 'Loaded');
      expect(response.correlationId, 'corr-abc');
      expect(response.timestamp, isNotNull);
    });

    test('ApiResponse parses failure response', () {
      final json = {
        'success': false,
        'data': null,
        'error': 'Unauthorized',
      };

      final response = ApiResponse<String>.fromJson(
        json,
        (data) => data as String,
      );

      expect(response.success, false);
      expect(response.data, isNull);
      expect(response.error, 'Unauthorized');
    });

    test('PagedResult parses pagination fields', () {
      final json = {
        'items': ['job1', 'job2', 'job3'],
        'page': 1,
        'pageSize': 10,
        'totalCount': 25,
        'totalPages': 3,
        'hasPreviousPage': false,
        'hasNextPage': true,
      };

      final paged = PagedResult.fromJson(
        json,
        (item) => item as String,
      );

      expect(paged.items.length, 3);
      expect(paged.page, 1);
      expect(paged.pageSize, 10);
      expect(paged.totalCount, 25);
      expect(paged.totalPages, 3);
      expect(paged.hasPreviousPage, false);
      expect(paged.hasNextPage, true);
    });

    test('PagedResult.empty creates default empty result', () {
      final empty = PagedResult<int>.empty();
      expect(empty.items, isEmpty);
      expect(empty.totalCount, 0);
      expect(empty.hasNextPage, false);
    });
  });
}
