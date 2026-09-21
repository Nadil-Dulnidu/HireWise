import '../../../../shared/models/enums.dart';

class JobSummaryDto {
  final String id;
  final String title;
  final String location;
  final EmploymentType employmentType;
  final ExperienceLevel experienceLevel;
  final num? salaryMin;
  final num? salaryMax;
  final String salaryCurrency;
  final JobStatus status;
  final String companyId;
  final String companyName;
  final String? companyLogoUrl;
  final String? departmentName;
  final DateTime? applicationDeadline;
  final DateTime createdAt;

  const JobSummaryDto({
    required this.id,
    required this.title,
    required this.location,
    required this.employmentType,
    required this.experienceLevel,
    this.salaryMin,
    this.salaryMax,
    this.salaryCurrency = 'USD',
    required this.status,
    required this.companyId,
    required this.companyName,
    this.companyLogoUrl,
    this.departmentName,
    this.applicationDeadline,
    required this.createdAt,
  });

  factory JobSummaryDto.fromJson(Map<String, dynamic> json) {
    final empTypeStr = json['employmentType'] as String? ?? 'FULL_TIME';
    final expLevelStr = json['experienceLevel'] as String? ?? 'MID';
    final statusStr = json['status'] as String? ?? 'OPEN';

    final employmentType = EmploymentType.values.firstWhere(
      (e) =>
          e.name.toUpperCase() == empTypeStr.replaceAll('_', '').toUpperCase(),
      orElse: () => EmploymentType.values.firstWhere(
        (e) => e.name == empTypeStr,
        orElse: () => EmploymentType.fullTime,
      ),
    );

    final experienceLevel = ExperienceLevel.values.firstWhere(
      (e) => e.name.toUpperCase() == expLevelStr.toUpperCase(),
      orElse: () => ExperienceLevel.mid,
    );

    final status = JobStatus.values.firstWhere(
      (s) => s.name.toUpperCase() == statusStr.toUpperCase(),
      orElse: () => JobStatus.open,
    );

    return JobSummaryDto(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      location: json['location'] as String? ?? '',
      employmentType: employmentType,
      experienceLevel: experienceLevel,
      salaryMin: json['salaryMin'] as num?,
      salaryMax: json['salaryMax'] as num?,
      salaryCurrency: json['salaryCurrency'] as String? ?? 'USD',
      status: status,
      companyId: json['companyId'] as String? ?? '',
      companyName: json['companyName'] as String? ?? '',
      companyLogoUrl: json['companyLogoUrl'] as String?,
      departmentName: json['departmentName'] as String?,
      applicationDeadline: json['applicationDeadline'] != null
          ? DateTime.tryParse(json['applicationDeadline'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
