import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../providers/notifications_provider.dart';
import 'widgets/notification_tile.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (state.unreadCount > 0)
            TextButton(
              onPressed: () {
                ref.read(notificationsProvider.notifier).markAllAsRead();
              },
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: Builder(
        builder: (context) {
          if (state.isLoading && state.notifications.isEmpty) {
            return const LoadingIndicator(message: 'Loading notifications...');
          }

          if (state.errorMessage != null && state.notifications.isEmpty) {
            return ErrorView(
              error: state.errorMessage,
              onRetry: () =>
                  ref.read(notificationsProvider.notifier).loadNotifications(),
            );
          }

          if (state.notifications.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_none_rounded,
              title: 'No Notifications',
              message:
                  'You are all caught up! New application updates and interview invites will appear here.',
            );
          }

          return RefreshIndicator(
            onRefresh: () =>
                ref.read(notificationsProvider.notifier).loadNotifications(),
            color: AppColors.primary,
            child: ListView.builder(
              itemCount: state.notifications.length,
              itemBuilder: (context, index) {
                final notification = state.notifications[index];
                return NotificationTile(
                  notification: notification,
                  onTap: () {
                    ref
                        .read(notificationsProvider.notifier)
                        .markAsRead(notification.id);
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
