import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/availability/data/models/availability_slot_dto.dart';
import 'package:hirewise_mobile/features/availability/data/models/create_availability_slot_request.dart';

void main() {
  group('Availability Models Tests', () {
    test('AvailabilitySlotDto parses valid JSON with integer dayOfWeek', () {
      final json = {
        'id': 'slot-123',
        'userId': 'user-456',
        'dayOfWeek': 1,
        'startTime': '09:00:00',
        'endTime': '17:00:00',
        'timezone': 'UTC',
        'isRecurring': true,
        'specificDate': null,
        'createdAt': '2026-10-01T10:00:00Z',
      };

      final dto = AvailabilitySlotDto.fromJson(json);

      expect(dto.id, 'slot-123');
      expect(dto.userId, 'user-456');
      expect(dto.dayOfWeek, 1);
      expect(dto.dayName, 'Monday');
      expect(dto.dayShortName, 'Mon');
      expect(dto.formattedTimeRange, '9:00 AM – 5:00 PM');
      expect(dto.isRecurring, isTrue);
    });

    test('AvailabilitySlotDto parses string dayOfWeek correctly', () {
      final json = {
        'id': 'slot-wed',
        'dayOfWeek': 'Wednesday',
        'startTime': '13:30:00',
        'endTime': '15:00:00',
        'isRecurring': true,
      };

      final dto = AvailabilitySlotDto.fromJson(json);

      expect(dto.dayOfWeek, 3);
      expect(dto.dayName, 'Wednesday');
      expect(dto.formattedTimeRange, '1:30 PM – 3:00 PM');
    });

    test('CreateAvailabilitySlotRequest serializes to JSON correctly', () {
      final request = CreateAvailabilitySlotRequest(
        dayOfWeek: 5,
        startTime: '09:00:00',
        endTime: '17:00:00',
        timezone: 'America/New_York',
        isRecurring: true,
      );

      final json = request.toJson();

      expect(json['dayOfWeek'], 5);
      expect(json['startTime'], '09:00:00');
      expect(json['endTime'], '17:00:00');
      expect(json['timezone'], 'America/New_York');
      expect(json['isRecurring'], isTrue);
    });
  });
}
