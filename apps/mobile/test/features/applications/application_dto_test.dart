import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/applications/data/models/application_dto.dart';
import 'package:hirewise_mobile/features/applications/data/models/apply_job_request.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('Application Models Tests', () {
    test('ApplicationDto parses valid JSON', () {
      final json = {
        'id': 'app-1',
        'jobId': 'job-10',
        'jobTitle': 'Senior Flutter Engineer',
        'jobLocation': 'San Francisco, CA',
        'jobEmploymentType': 'FULL_TIME',
        'companyId': 'comp-10',
        'companyName': 'Google DeepMind',
        'candidateId': 'cand-1',
        'candidateName': 'John Doe',
        'candidateEmail': 'john@example.com',
        'status': 'AI_REVIEW',
        'coverLetter': 'Excited about the role.',
        'appliedAt': '2026-09-12T10:00:00Z',
        'createdAt': '2026-09-12T10:00:00Z',
      };

      final dto = ApplicationDto.fromJson(json);

      expect(dto.id, 'app-1');
      expect(dto.jobTitle, 'Senior Flutter Engineer');
      expect(dto.status, ApplicationStatus.aiReview);
      expect(dto.coverLetter, 'Excited about the role.');
      expect(dto.candidateName, 'John Doe');
    });

    test('ApplicationDetailDto parses extra fields', () {
      final json = {
        'id': 'app-2',
        'jobId': 'job-20',
        'jobTitle': 'Lead Cloud Architect',
        'jobLocation': 'Austin, TX',
        'jobEmploymentType': 'FULL_TIME',
        'companyId': 'comp-20',
        'companyName': 'CloudCorp',
        'candidateId': 'cand-2',
        'candidateName': 'Jane Smith',
        'candidateEmail': 'jane@example.com',
        'status': 'INTERVIEW_SCHEDULED',
        'appliedAt': '2026-09-14T10:00:00Z',
        'createdAt': '2026-09-14T10:00:00Z',
        'jobDescription': 'Lead cloud migration projects.',
        'jobRequirements': 'AWS, GCP, Terraform',
        'hasInterviewScheduled': true,
        'interviewId': 'interview-99',
      };

      final dto = ApplicationDetailDto.fromJson(json);

      expect(dto.id, 'app-2');
      expect(dto.hasInterviewScheduled, true);
      expect(dto.interviewId, 'interview-99');
      expect(dto.jobDescription, 'Lead cloud migration projects.');
    });

    test('ApplyJobRequest serialization', () {
      const req = ApplyJobRequest(coverLetter: '  My cover letter  ');
      final json = req.toJson();
      expect(json['coverLetter'], 'My cover letter');

      const emptyReq = ApplyJobRequest(coverLetter: '   ');
      expect(emptyReq.toJson().containsKey('coverLetter'), false);
    });
  });
}
