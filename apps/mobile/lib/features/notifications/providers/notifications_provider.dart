import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/notification_dto.dart';
import '../data/repositories/notification_repository.dart';
import '../data/repositories/signalr_service.dart';

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

  NotificationsNotifier(this._repository, this._signalRService)
      : super(NotificationsState.initial()) {
    _signalRService.addListener(_onNotificationReceived);
    loadNotifications();
  }

  void _onNotificationReceived(NotificationDto notification) {
    state = state.copyWith(
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    );
  }

  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final list = await _repository.getNotifications();
      final count = await _repository.getUnreadCount();
      state = state.copyWith(
        notifications: list,
        unreadCount: count,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
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
    _signalRService.removeListener(_onNotificationReceived);
    super.dispose();
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final repository = ref.watch(notificationRepositoryProvider);
  final signalR = ref.watch(signalRServiceProvider);
  return NotificationsNotifier(repository, signalR);
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).unreadCount;
});
