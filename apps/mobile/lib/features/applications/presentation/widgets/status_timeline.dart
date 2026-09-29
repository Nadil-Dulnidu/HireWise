import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/enums.dart';

// Timeline widget displaying progressive recruitment stages and active status for an application
class StatusTimeline extends StatelessWidget {
  final ApplicationStatus currentStatus;

  const StatusTimeline({super.key, required this.currentStatus});

  static const List<_TimelineStep> _stages = [
    _TimelineStep(
      label: 'Applied',
      statuses: [ApplicationStatus.applied],
    ),
    _TimelineStep(
      label: 'AI Review',
      statuses: [
        ApplicationStatus.aiReview,
        ApplicationStatus.aiRecommended,
      ],
    ),
    _TimelineStep(
      label: 'Recruiter',
      statuses: [
        ApplicationStatus.recruiterReview,
        ApplicationStatus.evaluationPending,
      ],
    ),
    _TimelineStep(
      label: 'Interview',
      statuses: [
        ApplicationStatus.interviewApproved,
        ApplicationStatus.interviewScheduled,
        ApplicationStatus.interviewCompleted,
      ],
    ),
    _TimelineStep(
      label: 'Decision',
      statuses: [
        ApplicationStatus.selected,
        ApplicationStatus.rejected,
      ],
    ),
  ];

  // Calculate active timeline stage index based on current application status
  int get _currentStageIndex {
    for (int i = 0; i < _stages.length; i++) {
      if (_stages[i].statuses.contains(currentStatus)) {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = _currentStageIndex;
    final isRejected = currentStatus == ApplicationStatus.rejected;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        children: List.generate(_stages.length, (index) {
          final isPast = index < activeIndex;
          final isCurrent = index == activeIndex;
          final isLast = index == _stages.length - 1;

          Color stepColor;
          if (isCurrent) {
            stepColor =
                isRejected && isLast ? AppColors.error : AppColors.primary;
          } else if (isPast) {
            stepColor = AppColors.success;
          } else {
            stepColor = AppColors.slate300;
          }

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: isPast
                              ? AppColors.success
                              : (isCurrent ? stepColor : Colors.white),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: stepColor,
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: isPast
                              ? const Icon(Icons.check,
                                  size: 14, color: Colors.white)
                              : (isCurrent
                                  ? (isRejected && isLast
                                      ? const Icon(Icons.close,
                                          size: 14, color: Colors.white)
                                      : Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: Colors.white,
                                            shape: BoxShape.circle,
                                          ),
                                        ))
                                  : null),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _stages[index].label,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight:
                              isCurrent ? FontWeight.w700 : FontWeight.w500,
                          color: isCurrent
                              ? AppColors.slate900
                              : (isPast
                                  ? AppColors.slate700
                                  : AppColors.slate400),
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 14,
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 18),
                    color: isPast ? AppColors.success : AppColors.slate200,
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// Helper data model representing a single recruitment stage with mapped status values
class _TimelineStep {
  final String label;
  final List<ApplicationStatus> statuses;

  const _TimelineStep({
    required this.label,
    required this.statuses,
  });
}
