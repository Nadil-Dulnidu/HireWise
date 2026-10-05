import '../../../../shared/models/enums.dart';

class InterviewDto {
  final String id;
  final String applicationId;
  final String jobId;
  final String jobTitle;
  final String companyId;
  final String companyName;
  final String candidateId;
  final String candidateName;
  final String candidateEmail;
  final String? candidateProfileImageUrl;
  final String interviewerId;
  final String interviewerName;
  final String interviewerEmail;
  final DateTime scheduledStartTime;
  final DateTime scheduledEndTime;
  final String? meetingLink;
  final InterviewStatus status;
  final String? notes;
  final DateTime createdAt;

  const InterviewDto({
    required this.id,
    required this.applicationId,
    required this.jobId,
    required this.jobTitle,
    required this.companyId,
    required this.companyName,
    required this.candidateId,
    required this.candidateName,
    required this.candidateEmail,
    this.candidateProfileImageUrl,
    required this.interviewerId,
    required this.interviewerName,
    required this.interviewerEmail,
    required this.scheduledStartTime,
    required this.scheduledEndTime,
    this.meetingLink,
    required this.status,
    this.notes,
    required this.createdAt,
  });

  factory InterviewDto.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status'] as String? ?? 'SCHEDULED';

    final status = InterviewStatus.values.firstWhere(
      (s) =>
          s.name.toUpperCase() == statusStr.replaceAll('_', '').toUpperCase(),
      orElse: () => InterviewStatus.values.firstWhere(
        (s) => s.name.toUpperCase() == statusStr.toUpperCase(),
        orElse: () => InterviewStatus.scheduled,
      ),
    );

    return InterviewDto(
      id: json['id'] as String? ?? '',
      applicationId: json['applicationId'] as String? ?? '',
      jobId: json['jobId'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      companyId: json['companyId'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      candidateId: json['candidateId'] as String? ?? '',
      candidateName: json['candidateName'] as String? ?? '',
      candidateEmail: json['candidateEmail'] as String? ?? '',
      candidateProfileImageUrl: json['candidateProfileImageUrl'] as String?,
      interviewerId: json['interviewerId'] as String? ?? '',
      interviewerName: json['interviewerName'] as String? ?? '',
      interviewerEmail: json['interviewerEmail'] as String? ?? '',
      scheduledStartTime: json['scheduledStartTime'] != null
          ? DateTime.tryParse(json['scheduledStartTime'] as String) ??
              DateTime.now()
          : DateTime.now(),
      scheduledEndTime: json['scheduledEndTime'] != null
          ? DateTime.tryParse(json['scheduledEndTime'] as String) ??
              DateTime.now()
          : DateTime.now(),
      meetingLink: json['meetingLink'] as String?,
      status: status,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isUpcoming =>
      scheduledStartTime.isAfter(DateTime.now()) &&
      (status == InterviewStatus.scheduled ||
          status == InterviewStatus.inProgress);
}
