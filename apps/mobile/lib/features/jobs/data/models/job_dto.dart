import '../../../../shared/models/enums.dart';

class JobDto {
  final String id;
  final String title;
  final String description;
  final String requirements;
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
  final String? companyLocation;
  final String? departmentId;
  final String? departmentName;
  final DateTime? applicationDeadline;
  final int applicationCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  const JobDto({
    required this.id,
    required this.title,
    required this.description,
    required this.requirements,
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
    this.companyLocation,
    this.departmentId,
    this.departmentName,
    this.applicationDeadline,
    this.applicationCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory JobDto.fromJson(Map<String, dynamic> json) {
    final empTypeStr = json['employmentType'] as String? ?? 'FULL_TIME';
    final expLevelStr = json['experienceLevel'] as String? ?? 'MID';
    final statusStr = json['status'] as String? ?? 'OPEN';

    final employmentType = EmploymentType.values.firstWhere(
      (e) =>
          e.name.toUpperCase() == empTypeStr.replaceAll('_', '').toUpperCase(),
      orElse: () => EmploymentType.fullTime,
    );

    final experienceLevel = ExperienceLevel.values.firstWhere(
      (e) => e.name.toUpperCase() == expLevelStr.toUpperCase(),
      orElse: () => ExperienceLevel.mid,
    );

    final status = JobStatus.values.firstWhere(
      (s) => s.name.toUpperCase() == statusStr.toUpperCase(),
      orElse: () => JobStatus.open,
    );

    return JobDto(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      requirements: json['requirements'] as String? ?? '',
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
      companyLocation: json['companyLocation'] as String?,
      departmentId: json['departmentId'] as String?,
      departmentName: json['departmentName'] as String?,
      applicationDeadline: json['applicationDeadline'] != null
          ? DateTime.tryParse(json['applicationDeadline'] as String)
          : null,
      applicationCount: json['applicationCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
