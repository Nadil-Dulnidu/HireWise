import '../../../../shared/models/enums.dart';

class JobFilterRequest {
  final String? search;
  final EmploymentType? employmentType;
  final ExperienceLevel? experienceLevel;
  final num? minSalary;
  final num? maxSalary;
  final int page;
  final int pageSize;

  const JobFilterRequest({
    this.search,
    this.employmentType,
    this.experienceLevel,
    this.minSalary,
    this.maxSalary,
    this.page = 1,
    this.pageSize = 10,
  });

  JobFilterRequest copyWith({
    String? search,
    EmploymentType? employmentType,
    ExperienceLevel? experienceLevel,
    num? minSalary,
    num? maxSalary,
    int? page,
    int? pageSize,
    bool clearEmploymentType = false,
    bool clearExperienceLevel = false,
  }) {
    return JobFilterRequest(
      search: search ?? this.search,
      employmentType:
          clearEmploymentType ? null : (employmentType ?? this.employmentType),
      experienceLevel: clearExperienceLevel
          ? null
          : (experienceLevel ?? this.experienceLevel),
      minSalary: minSalary ?? this.minSalary,
      maxSalary: maxSalary ?? this.maxSalary,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
    );
  }

  Map<String, dynamic> toQueryParameters() {
    final params = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
      'publicOnly': true,
    };

    if (search != null && search!.trim().isNotEmpty) {
      params['search'] = search!.trim();
    }
    if (employmentType != null) {
      // Format as FULL_TIME
      params['employmentType'] = employmentType == EmploymentType.fullTime
          ? 'FULL_TIME'
          : (employmentType == EmploymentType.partTime
              ? 'PART_TIME'
              : employmentType!.name.toUpperCase());
    }
    if (experienceLevel != null) {
      params['experienceLevel'] = experienceLevel!.name.toUpperCase();
    }
    if (minSalary != null) {
      params['minSalary'] = minSalary;
    }
    if (maxSalary != null) {
      params['maxSalary'] = maxSalary;
    }

    return params;
  }

  bool get hasActiveFilters =>
      employmentType != null ||
      experienceLevel != null ||
      minSalary != null ||
      maxSalary != null;
}
