import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/enums.dart';
import '../../data/models/notification_dto.dart';
import '../../providers/notification_popup_provider.dart';

class NotificationBannerOverlay extends ConsumerStatefulWidget {
  final Widget child;

  const NotificationBannerOverlay({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<NotificationBannerOverlay> createState() =>
      _NotificationBannerOverlayState();
}

class _NotificationBannerOverlayState
    extends ConsumerState<NotificationBannerOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _fadeAnimation;
  NotificationDto? _currentNotification;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1.2),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      ),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _showNotification(NotificationDto notification) {
    _dismissTimer?.cancel();
    setState(() {
      _currentNotification = notification;
    });

    // Provide tactile mobile phone feedback
    HapticFeedback.heavyImpact();
    SystemSound.play(SystemSoundType.alert);

    _controller.forward(from: 0.0);

    // Auto dismiss after 6 seconds
    _dismissTimer = Timer(const Duration(seconds: 6), () {
      _dismiss();
    });
  }

  void _dismiss() {
    _dismissTimer?.cancel();
    if (_controller.isAnimating || _controller.isCompleted) {
      _controller.reverse().then((_) {
        if (mounted) {
          setState(() {
            _currentNotification = null;
          });
          ref.read(notificationPopupProvider.notifier).dismiss();
        }
      });
    }
  }

  void _handleTap() {
    final notification = _currentNotification;
    _dismiss();

    if (notification == null) return;

    if (notification.referenceType?.toUpperCase() == 'INTERVIEW' ||
        notification.type == NotificationType.interviewScheduled) {
      context.go('/interviews');
    } else if (notification.referenceType?.toUpperCase() == 'APPLICATION' ||
        notification.type == NotificationType.applicationUpdate) {
      context.go('/applications');
    } else {
      context.go('/notifications');
    }
  }

  IconData _getIconForType(NotificationType type) {
    switch (type) {
      case NotificationType.applicationUpdate:
        return Icons.assignment_turned_in_rounded;
      case NotificationType.interviewScheduled:
        return Icons.event_available_rounded;
      case NotificationType.aiEvaluationComplete:
        return Icons.auto_awesome_rounded;
      case NotificationType.approvalRequired:
        return Icons.pending_actions_rounded;
      case NotificationType.feedbackSubmitted:
        return Icons.rate_review_rounded;
      case NotificationType.general:
        return Icons.notifications_active_rounded;
    }
  }

  Color _getColorForType(NotificationType type) {
    switch (type) {
      case NotificationType.applicationUpdate:
        return AppColors.info;
      case NotificationType.interviewScheduled:
        return const Color(0xFF7E22CE); // purple
      case NotificationType.aiEvaluationComplete:
        return const Color(0xFF9333EA);
      case NotificationType.approvalRequired:
        return AppColors.warning;
      case NotificationType.feedbackSubmitted:
        return AppColors.success;
      case NotificationType.general:
        return AppColors.primary;
    }
  }

  String _friendlyTitle(String title) {
    return title
        .replaceAll('AI_EVALUATION_COMPLETE', 'Evaluation Complete')
        .replaceAll('APPLICATION_UPDATE', 'Application Update')
        .replaceAll('INTERVIEW_SCHEDULED', 'Interview Confirmed!')
        .replaceAll('APPROVAL_REQUIRED', 'Review Required')
        .replaceAll('FEEDBACK_SUBMITTED', 'Feedback Submitted')
        .trim();
  }

  @override
  Widget build(BuildContext context) {
    // Listen for new popup triggers
    ref.listen<NotificationDto?>(notificationPopupProvider, (_, next) {
      if (next != null) {
        _showNotification(next);
      }
    });

    final topPadding = MediaQuery.of(context).padding.top;

    return Stack(
      children: [
        widget.child,
        if (_currentNotification != null)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Padding(
                  padding: EdgeInsets.only(
                    top: topPadding + 8,
                    left: 14,
                    right: 14,
                  ),
                  child: GestureDetector(
                    onVerticalDragUpdate: (details) {
                      if (details.primaryDelta != null &&
                          details.primaryDelta! < -4) {
                        _dismiss();
                      }
                    },
                    child: Material(
                      elevation: 10,
                      shadowColor: Colors.black.withOpacity(0.35),
                      borderRadius: BorderRadius.circular(16),
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _handleTap,
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: _getColorForType(_currentNotification!.type)
                                  .withOpacity(0.35),
                              width: 1.5,
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: _getColorForType(
                                          _currentNotification!.type)
                                      .withOpacity(0.12),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _getIconForType(_currentNotification!.type),
                                  color: _getColorForType(
                                      _currentNotification!.type),
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Text(
                                              'HireWise',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                            Text(
                                              ' • Just now',
                                              style: TextStyle(
                                                fontSize: 11.5,
                                                color: AppColors.slate400,
                                              ),
                                            ),
                                          ],
                                        ),
                                        GestureDetector(
                                          onTap: _dismiss,
                                          behavior: HitTestBehavior.opaque,
                                          child: const Icon(
                                            Icons.close_rounded,
                                            size: 18,
                                            color: AppColors.slate400,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      _friendlyTitle(
                                          _currentNotification!.title),
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.slate900,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      _currentNotification!.message,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.slate700,
                                        height: 1.3,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Text(
                                          'Tap to view details',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: _getColorForType(
                                                _currentNotification!.type),
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Icon(
                                          Icons.arrow_forward_rounded,
                                          size: 13,
                                          color: _getColorForType(
                                              _currentNotification!.type),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
