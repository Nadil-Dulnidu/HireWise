import 'package:flutter_test/flutter_test.dart';
import 'package:hirewise_mobile/shared/models/enums.dart';

void main() {
  group('Enums Domain Tests', () {
    test('UserRole display names', () {
      expect(UserRole.candidate.displayName, 'Candidate');
      expect(UserRole.recruiter.displayName, 'Recruiter');
      expect(UserRole.interviewer.displayName, 'Interviewer');
      expect(UserRole.admin.displayName, 'Admin');
    });

    test('ApplicationStatus terminal and active properties', () {
      expect(ApplicationStatus.applied.isActive, true);
      expect(ApplicationStatus.applied.isTerminal, false);
      expect(ApplicationStatus.selected.isTerminal, true);
      expect(ApplicationStatus.selected.isActive, false);
      expect(ApplicationStatus.rejected.isTerminal, true);
      expect(ApplicationStatus.rejected.isActive, false);
    });

    test('JobStatus display names', () {
      expect(JobStatus.open.displayName, 'Open');
      expect(JobStatus.closed.displayName, 'Closed');
    });

    test('InterviewStatus display names', () {
      expect(InterviewStatus.scheduled.displayName, 'Scheduled');
      expect(InterviewStatus.completed.displayName, 'Completed');
    });
  });
}
