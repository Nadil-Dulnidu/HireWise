import '../../../../shared/models/enums.dart';

class ApplicationDto {
  final String id;
  final String jobId;
  final String jobTitle;
  final String jobLocation;
  final EmploymentType jobEmploymentType;
  final String companyId;
  final String companyName;
  final String? companyLogoUrl;
  final String candidateId;
  final String candidateName;
  final String candidateEmail;
  final ApplicationStatus status;
  final String? resumeSnapshotUrl;
  final String? coverLetter;
  final String? aiWorkflowId;
  final DateTime appliedAt;
  final DateTime createdAt;

  const ApplicationDto({
    required this.id,
    required this.jobId,
    required this.jobTitle,
    required this.jobLocation,
    required this.jobEmploymentType,
    required this.companyId,
    required this.companyName,
    this.companyLogoUrl,
    required this.candidateId,
    required this.candidateName,
    required this.candidateEmail,
    required this.status,
    this.resumeSnapshotUrl,
    this.coverLetter,
    this.aiWorkflowId,
    required this.appliedAt,
    required this.createdAt,
  });

  factory ApplicationDto.fromJson(Map<String, dynamic> json) {
    final empTypeStr = json['jobEmploymentType'] as String? ?? 'FULL_TIME';
    final statusStr = json['status'] as String? ?? 'APPLIED';

    final employmentType = EmploymentType.values.firstWhere(
      (e) =>
          e.name.toUpperCase() == empTypeStr.replaceAll('_', '').toUpperCase(),
      orElse: () => EmploymentType.fullTime,
    );

    final status = ApplicationStatus.values.firstWhere(
      (s) =>
          s.name.toUpperCase() == statusStr.replaceAll('_', '').toUpperCase(),
      orElse: () => ApplicationStatus.values.firstWhere(
        (s) => s.name.toUpperCase() == statusStr.toUpperCase(),
        orElse: () => ApplicationStatus.applied,
      ),
    );

    return ApplicationDto(
      id: json['id'] as String? ?? '',
      jobId: json['jobId'] as String? ?? '',
      jobTitle: json['jobTitle'] as String? ?? '',
      jobLocation: json['jobLocation'] as String? ?? '',
      jobEmploymentType: employmentType,
      companyId: json['companyId'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      companyLogoUrl: json['companyLogoUrl'] as String?,
      candidateId: json['candidateId'] as String? ?? '',
      candidateName: json['candidateName'] as String? ?? '',
      candidateEmail: json['candidateEmail'] as String? ?? '',
      status: status,
      resumeSnapshotUrl: json['resumeSnapshotUrl'] as String?,
      coverLetter: json['coverLetter'] as String?,
      aiWorkflowId: json['aiWorkflowId'] as String?,
      appliedAt: json['appliedAt'] != null
          ? DateTime.tryParse(json['appliedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ApplicationDetailDto extends ApplicationDto {
  final String jobDescription;
  final String jobRequirements;
  final num? jobSalaryMin;
  final num? jobSalaryMax;
  final String jobSalaryCurrency;
  final String? candidatePhone;
  final String? candidateProfileImageUrl;
  final bool hasInterviewScheduled;
  final String? interviewId;

  const ApplicationDetailDto({
    required super.id,
    required super.jobId,
    required super.jobTitle,
    required super.jobLocation,
    required super.jobEmploymentType,
    required super.companyId,
    required super.companyName,
    super.companyLogoUrl,
    required super.candidateId,
    required super.candidateName,
    required super.candidateEmail,
    required super.status,
    super.resumeSnapshotUrl,
    super.coverLetter,
    super.aiWorkflowId,
    required super.appliedAt,
    required super.createdAt,
    this.jobDescription = '',
    this.jobRequirements = '',
    this.jobSalaryMin,
    this.jobSalaryMax,
    this.jobSalaryCurrency = 'USD',
    this.candidatePhone,
    this.candidateProfileImageUrl,
    this.hasInterviewScheduled = false,
    this.interviewId,
  });

  factory ApplicationDetailDto.fromJson(Map<String, dynamic> json) {
    final base = ApplicationDto.fromJson(json);

    return ApplicationDetailDto(
      id: base.id,
      jobId: base.jobId,
      jobTitle: base.jobTitle,
      jobLocation: base.jobLocation,
      jobEmploymentType: base.jobEmploymentType,
      companyId: base.companyId,
      companyName: base.companyName,
      companyLogoUrl: base.companyLogoUrl,
      candidateId: base.candidateId,
      candidateName: base.candidateName,
      candidateEmail: base.candidateEmail,
      status: base.status,
      resumeSnapshotUrl: base.resumeSnapshotUrl,
      coverLetter: base.coverLetter,
      aiWorkflowId: base.aiWorkflowId,
      appliedAt: base.appliedAt,
      createdAt: base.createdAt,
      jobDescription: json['jobDescription'] as String? ?? '',
      jobRequirements: json['jobRequirements'] as String? ?? '',
      jobSalaryMin: json['jobSalaryMin'] as num?,
      jobSalaryMax: json['jobSalaryMax'] as num?,
      jobSalaryCurrency: json['jobSalaryCurrency'] as String? ?? 'USD',
      candidatePhone: json['candidatePhone'] as String?,
      candidateProfileImageUrl: json['candidateProfileImageUrl'] as String?,
      hasInterviewScheduled: json['hasInterviewScheduled'] as bool? ?? false,
      interviewId: json['interviewId'] as String?,
    );
  }
}
