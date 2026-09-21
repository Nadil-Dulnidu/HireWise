import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/enums.dart';
import '../../../../shared/utils/date_formatter.dart';
import '../../data/models/notification_dto.dart';

class NotificationTile extends StatelessWidget {
  final NotificationDto notification;
  final VoidCallback onTap;

  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
  });

  IconData _getIconForType(NotificationType type) {
    switch (type) {
      case NotificationType.applicationUpdate:
        return Icons.assignment_turned_in_outlined;
      case NotificationType.interviewScheduled:
        return Icons.event_available_outlined;
      case NotificationType.aiEvaluationComplete:
        return Icons.auto_awesome;
      case NotificationType.approvalRequired:
        return Icons.pending_actions_outlined;
      case NotificationType.feedbackSubmitted:
        return Icons.rate_review_outlined;
      case NotificationType.general:
        return Icons.notifications_outlined;
    }
  }

  Color _getColorForType(NotificationType type) {
    switch (type) {
      case NotificationType.applicationUpdate:
        return AppColors.info;
      case NotificationType.interviewScheduled:
        return AppColors.primary;
      case NotificationType.aiEvaluationComplete:
        return const Color(0xFF7E22CE); // purple
      case NotificationType.approvalRequired:
        return AppColors.warning;
      case NotificationType.feedbackSubmitted:
        return AppColors.success;
      case NotificationType.general:
        return AppColors.slate600;
    }
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = _getColorForType(notification.type);
    final isUnread = !notification.isRead;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isUnread
              ? AppColors.primaryContainer.withOpacity(0.2)
              : Colors.white,
          border: const Border(
            bottom: BorderSide(color: AppColors.slate200, width: 0.8),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getIconForType(notification.type),
                color: iconColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight:
                                isUnread ? FontWeight.w700 : FontWeight.w600,
                            color: AppColors.slate900,
                          ),
                        ),
                      ),
                      if (isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 6),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: TextStyle(
                      fontSize: 13,
                      color: isUnread ? AppColors.slate800 : AppColors.slate600,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    DateFormatter.timeAgo(notification.createdAt),
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppColors.slate400,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
