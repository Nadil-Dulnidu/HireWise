import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../models/enums.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  });

  factory StatusBadge.forApplication(ApplicationStatus status) {
    Color bg;
    Color text;
    IconData? icon;

    switch (status) {
      case ApplicationStatus.applied:
        bg = AppColors.infoContainer;
        text = AppColors.info;
        icon = Icons.send_outlined;
        break;
      case ApplicationStatus.aiReview:
      case ApplicationStatus.aiRecommended:
        bg = const Color(0xFFF3E8FF); // purple-100
        text = const Color(0xFF7E22CE); // purple-700
        icon = Icons.auto_awesome;
        break;
      case ApplicationStatus.recruiterReview:
      case ApplicationStatus.evaluationPending:
        bg = AppColors.warningContainer;
        text = AppColors.warning;
        icon = Icons.hourglass_top_outlined;
        break;
      case ApplicationStatus.interviewApproved:
      case ApplicationStatus.interviewScheduled:
      case ApplicationStatus.interviewCompleted:
        bg = AppColors.primaryContainer;
        text = AppColors.primary;
        icon = Icons.event_available;
        break;
      case ApplicationStatus.selected:
        bg = AppColors.successContainer;
        text = AppColors.success;
        icon = Icons.check_circle_outline;
        break;
      case ApplicationStatus.rejected:
        bg = AppColors.errorContainer;
        text = AppColors.error;
        icon = Icons.cancel_outlined;
        break;
    }

    return StatusBadge(
      label: status.displayName,
      backgroundColor: bg,
      textColor: text,
      icon: icon,
    );
  }

  factory StatusBadge.forInterview(InterviewStatus status) {
    Color bg;
    Color text;

    switch (status) {
      case InterviewStatus.scheduled:
        bg = AppColors.primaryContainer;
        text = AppColors.primary;
        break;
      case InterviewStatus.inProgress:
        bg = AppColors.warningContainer;
        text = AppColors.warning;
        break;
      case InterviewStatus.completed:
        bg = AppColors.successContainer;
        text = AppColors.success;
        break;
      case InterviewStatus.cancelled:
      case InterviewStatus.noShow:
        bg = AppColors.errorContainer;
        text = AppColors.error;
        break;
    }

    return StatusBadge(
      label: status.displayName,
      backgroundColor: bg,
      textColor: text,
    );
  }

  factory StatusBadge.forJob(JobStatus status) {
    Color bg;
    Color text;

    switch (status) {
      case JobStatus.open:
        bg = AppColors.successContainer;
        text = AppColors.success;
        break;
      case JobStatus.draft:
        bg = AppColors.slate200;
        text = AppColors.slate700;
        break;
      case JobStatus.paused:
        bg = AppColors.warningContainer;
        text = AppColors.warning;
        break;
      case JobStatus.closed:
        bg = AppColors.errorContainer;
        text = AppColors.error;
        break;
    }

    return StatusBadge(
      label: status.displayName,
      backgroundColor: bg,
      textColor: text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
