import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/jobs/data/models/job_dto.dart';
import 'package:hirewise_mobile/features/jobs/data/models/job_filter_request.dart';
import 'package:hirewise_mobile/features/jobs/data/models/job_summary_dto.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('Job Models Tests', () {
    test('JobSummaryDto parses valid JSON', () {
      final json = {
        'id': 'job-1',
        'title': 'Senior Flutter Engineer',
        'location': 'Remote',
        'employmentType': 'FULL_TIME',
        'experienceLevel': 'SENIOR',
        'salaryMin': 120000,
        'salaryMax': 150000,
        'salaryCurrency': 'USD',
        'status': 'OPEN',
        'companyId': 'comp-1',
        'companyName': 'TechCorp',
        'createdAt': '2026-09-01T12:00:00Z',
      };

      final dto = JobSummaryDto.fromJson(json);

      expect(dto.id, 'job-1');
      expect(dto.title, 'Senior Flutter Engineer');
      expect(dto.employmentType, EmploymentType.fullTime);
      expect(dto.experienceLevel, ExperienceLevel.senior);
      expect(dto.status, JobStatus.open);
      expect(dto.salaryMin, 120000);
      expect(dto.salaryMax, 150000);
      expect(dto.companyName, 'TechCorp');
    });

    test('JobDto parses complete job details', () {
      final json = {
        'id': 'job-2',
        'title': 'Backend .NET Lead',
        'description': 'Architect scalable microservices',
        'requirements': 'C#, .NET 8, PostgreSQL',
        'location': 'New York, NY',
        'employmentType': 'CONTRACT',
        'experienceLevel': 'LEAD',
        'salaryMin': 160000,
        'salaryMax': 180000,
        'status': 'OPEN',
        'companyId': 'comp-2',
        'companyName': 'FinTech Inc',
        'applicationCount': 12,
        'createdAt': '2026-09-10T12:00:00Z',
        'updatedAt': '2026-09-15T12:00:00Z',
      };

      final dto = JobDto.fromJson(json);

      expect(dto.id, 'job-2');
      expect(dto.description, 'Architect scalable microservices');
      expect(dto.requirements, 'C#, .NET 8, PostgreSQL');
      expect(dto.applicationCount, 12);
    });

    test('JobFilterRequest builds query parameters', () {
      const filter = JobFilterRequest(
        search: 'Flutter',
        employmentType: EmploymentType.fullTime,
        experienceLevel: ExperienceLevel.senior,
        minSalary: 100000,
        page: 2,
        pageSize: 15,
      );

      final query = filter.toQueryParameters();

      expect(query['search'], 'Flutter');
      expect(query['employmentType'], 'FULL_TIME');
      expect(query['experienceLevel'], 'SENIOR');
      expect(query['minSalary'], 100000);
      expect(query['page'], 2);
      expect(query['pageSize'], 15);
      expect(filter.hasActiveFilters, true);
    });
  });
}
