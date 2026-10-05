import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/notifications/data/models/notification_dto.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('Notification Models Tests', () {
    test('NotificationDto parses valid JSON', () {
      final json = {
        'id': 'notif-1',
        'userId': 'user-1',
        'title': 'Interview Scheduled',
        'message': 'Your interview for Senior Flutter Engineer is confirmed.',
        'type': 'INTERVIEW_SCHEDULED',
        'referenceType': 'Interview',
        'referenceId': 'int-123',
        'isRead': false,
        'createdAt': '2026-09-21T08:00:00Z',
      };

      final dto = NotificationDto.fromJson(json);

      expect(dto.id, 'notif-1');
      expect(dto.title, 'Interview Scheduled');
      expect(dto.type, NotificationType.interviewScheduled);
      expect(dto.referenceType, 'Interview');
      expect(dto.referenceId, 'int-123');
      expect(dto.isRead, false);
    });

    test('NotificationDto copyWith', () {
      final dto = NotificationDto(
        id: '1',
        userId: 'u1',
        title: 'Title',
        message: 'Message',
        type: NotificationType.general,
        isRead: false,
        createdAt: DateTime.now(),
      );

      final updated = dto.copyWith(isRead: true);
      expect(updated.isRead, true);
      expect(updated.id, '1');
    });
  });
}
