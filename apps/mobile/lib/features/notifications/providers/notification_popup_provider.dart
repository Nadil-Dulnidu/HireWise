import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/notification_dto.dart';

final notificationPopupProvider =
    StateNotifierProvider<NotificationPopupNotifier, NotificationDto?>((ref) {
  return NotificationPopupNotifier();
});

class NotificationPopupNotifier extends StateNotifier<NotificationDto?> {
  NotificationPopupNotifier() : super(null);

  void show(NotificationDto notification) {
    state = null; // Reset first so consecutive identical triggers fire
    state = notification;
  }

  void dismiss() {
    state = null;
  }
}
