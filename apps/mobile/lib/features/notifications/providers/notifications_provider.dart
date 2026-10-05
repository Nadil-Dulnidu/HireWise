import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/enums.dart';
import '../data/models/notification_dto.dart';
import '../data/repositories/notification_repository.dart';
import '../data/repositories/signalr_service.dart';
import 'notification_popup_provider.dart';

final signalRServiceProvider = Provider<SignalRService>((ref) {
  final service = SignalRService();
  ref.onDispose(() {
    service.disconnect();
  });
  return service;
});

class NotificationsState {
  final List<NotificationDto> notifications;
  final int unreadCount;
  final bool isLoading;
  final String? errorMessage;

  const NotificationsState({
    required this.notifications,
    this.unreadCount = 0,
    this.isLoading = false,
    this.errorMessage,
  });

  factory NotificationsState.initial() => const NotificationsState(
        notifications: [],
        isLoading: true,
      );

  NotificationsState copyWith({
    List<NotificationDto>? notifications,
    int? unreadCount,
    bool? isLoading,
    String? errorMessage,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final NotificationRepository _repository;
  final SignalRService _signalRService;
  final Ref _ref;
  Timer? _pollingTimer;
  final Set<String> _knownNotificationIds = {};
  bool _isFirstLoad = true;

  NotificationsNotifier(this._repository, this._signalRService, this._ref)
      : super(NotificationsState.initial()) {
    _signalRService.addListener(_onNotificationReceived);
    loadNotifications();
    _startPolling();
  }

  void _onNotificationReceived(NotificationDto notification) {
    debugPrint('[NotificationsNotifier] Received new notification: ${notification.title}');
    final isNew = !_knownNotificationIds.contains(notification.id);
    _knownNotificationIds.add(notification.id);

    // Update list & badge
    final existingIndex =
        state.notifications.indexWhere((n) => n.id == notification.id);
    final updatedList = existingIndex >= 0
        ? [
            ...state.notifications.sublist(0, existingIndex),
            notification,
            ...state.notifications.sublist(existingIndex + 1),
          ]
        : [notification, ...state.notifications];

    state = state.copyWith(
      notifications: updatedList,
      unreadCount: isNew ? state.unreadCount + 1 : state.unreadCount,
    );

    // Trigger visual pop-out mobile banner
    _ref.read(notificationPopupProvider.notifier).show(notification);
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 8), (_) async {
      await _pollNewNotifications();
    });
  }

  Future<void> _pollNewNotifications() async {
    try {
      final list = await _repository.getNotifications(limit: 10);
      final count = await _repository.getUnreadCount();

      NotificationDto? newestToPop;
      for (final item in list) {
        if (!_knownNotificationIds.contains(item.id)) {
          _knownNotificationIds.add(item.id);
          if (!_isFirstLoad && !item.isRead) {
            newestToPop ??= item;
          }
        }
      }

      state = state.copyWith(
        notifications: list,
        unreadCount: count,
      );

      // If a brand new notification was found during polling, pop it out
      if (newestToPop != null) {
        debugPrint('[NotificationsNotifier] Polled new notification: ${newestToPop.title}');
        _ref.read(notificationPopupProvider.notifier).show(newestToPop);
      }
    } catch (_) {}
  }

  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final list = await _repository.getNotifications();
      final count = await _repository.getUnreadCount();

      for (final n in list) {
        _knownNotificationIds.add(n.id);
      }
      _isFirstLoad = false;

      state = state.copyWith(
        notifications: list,
        unreadCount: count,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  /// Triggers a test interview notification banner (useful for verification)
  void triggerTestNotification() {
    final testNotification = NotificationDto(
      id: 'test-${DateTime.now().millisecondsSinceEpoch}',
      userId: 'test',
      title: 'Interview Confirmed!',
      message: 'Your interview with Apex Cloud Technologies is confirmed!',
      type: NotificationType.interviewScheduled,
      referenceType: 'INTERVIEW',
      referenceId: 'test-interview-id',
      isRead: false,
      createdAt: DateTime.now(),
    );
    _onNotificationReceived(testNotification);
  }

  Future<void> markAsRead(String id) async {
    // Optimistic update
    final updated = state.notifications.map((n) {
      if (n.id == id && !n.isRead) {
        return n.copyWith(isRead: true, readAt: DateTime.now());
      }
      return n;
    }).toList();

    final newCount = (state.unreadCount - 1).clamp(0, 9999);
    state = state.copyWith(notifications: updated, unreadCount: newCount);

    try {
      await _repository.markAsRead(id);
    } catch (_) {
      // Re-sync on failure
      loadNotifications();
    }
  }

  Future<void> markAllAsRead() async {
    final updated = state.notifications.map((n) {
      return n.copyWith(isRead: true, readAt: DateTime.now());
    }).toList();

    state = state.copyWith(notifications: updated, unreadCount: 0);

    try {
      await _repository.markAllAsRead();
    } catch (_) {
      loadNotifications();
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _signalRService.removeListener(_onNotificationReceived);
    super.dispose();
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final repository = ref.watch(notificationRepositoryProvider);
  final signalR = ref.watch(signalRServiceProvider);
  return NotificationsNotifier(repository, signalR, ref);
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).unreadCount;
});
