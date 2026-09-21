import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/utils/date_formatter.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../data/models/interview_dto.dart';

class InterviewCard extends StatelessWidget {
  final InterviewDto interview;
  final VoidCallback onTap;

  const InterviewCard({
    super.key,
    required this.interview,
    required this.onTap,
  });

  Future<void> _launchMeeting(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.slate200),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Job title + Status
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          interview.jobTitle,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.slate900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          interview.companyName,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppColors.slate600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge.forInterview(interview.status),
                ],
              ),
              const SizedBox(height: 14),

              // Date & Time
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.slate50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.slate200),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.event_outlined,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      DateFormatter.formatDate(interview.scheduledStartTime),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate900,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.access_time_rounded,
                      size: 16,
                      color: AppColors.slate500,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${DateFormatter.formatTime(interview.scheduledStartTime)} - ${DateFormatter.formatTime(interview.scheduledEndTime)}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.slate700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Interviewer name & meeting button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline_rounded,
                        size: 16,
                        color: AppColors.slate500,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Interviewer: ${interview.interviewerName}',
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: AppColors.slate600,
                        ),
                      ),
                    ],
                  ),
                  if (interview.meetingLink != null &&
                      interview.meetingLink!.isNotEmpty)
                    TextButton.icon(
                      onPressed: () => _launchMeeting(interview.meetingLink!),
                      icon: const Icon(Icons.video_camera_front_outlined,
                          size: 16),
                      label: const Text('Join', style: TextStyle(fontSize: 13)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
