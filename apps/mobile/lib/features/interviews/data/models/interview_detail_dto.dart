import 'interview_dto.dart';

class InterviewDetailDto extends InterviewDto {
  final String? jobDescription;
  final String? candidatePhone;
  final String? resumeSnapshotUrl;

  const InterviewDetailDto({
    required super.id,
    required super.applicationId,
    required super.jobId,
    required super.jobTitle,
    required super.companyId,
    required super.companyName,
    required super.candidateId,
    required super.candidateName,
    required super.candidateEmail,
    super.candidateProfileImageUrl,
    required super.interviewerId,
    required super.interviewerName,
    required super.interviewerEmail,
    required super.scheduledStartTime,
    required super.scheduledEndTime,
    super.meetingLink,
    required super.status,
    super.notes,
    required super.createdAt,
    this.jobDescription,
    this.candidatePhone,
    this.resumeSnapshotUrl,
  });

  factory InterviewDetailDto.fromJson(Map<String, dynamic> json) {
    final base = InterviewDto.fromJson(json);

    return InterviewDetailDto(
      id: base.id,
      applicationId: base.applicationId,
      jobId: base.jobId,
      jobTitle: base.jobTitle,
      companyId: base.companyId,
      companyName: base.companyName,
      candidateId: base.candidateId,
      candidateName: base.candidateName,
      candidateEmail: base.candidateEmail,
      candidateProfileImageUrl: base.candidateProfileImageUrl,
      interviewerId: base.interviewerId,
      interviewerName: base.interviewerName,
      interviewerEmail: base.interviewerEmail,
      scheduledStartTime: base.scheduledStartTime,
      scheduledEndTime: base.scheduledEndTime,
      meetingLink: base.meetingLink,
      status: base.status,
      notes: base.notes,
      createdAt: base.createdAt,
      jobDescription: json['jobDescription'] as String?,
      candidatePhone: json['candidatePhone'] as String?,
      resumeSnapshotUrl: json['resumeSnapshotUrl'] as String?,
    );
  }
}
