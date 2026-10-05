import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/features/interviews/data/models/interview_dto.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('Interview Models Tests', () {
    test('InterviewDto parses valid JSON', () {
      final futureDate = DateTime.now().add(const Duration(days: 7));
      final json = {
        'id': 'int-1',
        'applicationId': 'app-1',
        'jobId': 'job-1',
        'jobTitle': 'Senior Software Engineer',
        'companyId': 'comp-1',
        'companyName': 'HireWise Labs',
        'candidateId': 'cand-1',
        'candidateName': 'Alex Mercer',
        'candidateEmail': 'alex@example.com',
        'interviewerId': 'user-interviewer-1',
        'interviewerName': 'Sarah Connor',
        'interviewerEmail': 'sarah@hirewise.com',
        'scheduledStartTime': futureDate.toIso8601String(),
        'scheduledEndTime':
            futureDate.add(const Duration(hours: 1)).toIso8601String(),
        'meetingLink': 'https://meet.google.com/abc-def-ghi',
        'status': 'SCHEDULED',
        'notes': 'Technical architecture round.',
        'createdAt': '2026-09-20T10:00:00Z',
      };

      final dto = InterviewDto.fromJson(json);

      expect(dto.id, 'int-1');
      expect(dto.jobTitle, 'Senior Software Engineer');
      expect(dto.interviewerName, 'Sarah Connor');
      expect(dto.meetingLink, 'https://meet.google.com/abc-def-ghi');
      expect(dto.status, InterviewStatus.scheduled);
      expect(dto.notes, 'Technical architecture round.');
      expect(dto.isUpcoming, true);
    });
  });
}
