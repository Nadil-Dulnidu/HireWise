import 'package:json_annotation/json_annotation.dart';

enum UserRole {
  @JsonValue('ADMIN')
  admin,
  @JsonValue('RECRUITER')
  recruiter,
  @JsonValue('INTERVIEWER')
  interviewer,
  @JsonValue('CANDIDATE')
  candidate;

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.recruiter:
        return 'Recruiter';
      case UserRole.interviewer:
        return 'Interviewer';
      case UserRole.candidate:
        return 'Candidate';
    }
  }
}

enum UserStatus {
  @JsonValue('ONBOARDING')
  onboarding,
  @JsonValue('ACTIVE')
  active,
  @JsonValue('INACTIVE')
  inactive;

  String get displayName {
    switch (this) {
      case UserStatus.onboarding:
        return 'Onboarding';
      case UserStatus.active:
        return 'Active';
      case UserStatus.inactive:
        return 'Inactive';
    }
  }
}

enum JobStatus {
  @JsonValue('DRAFT')
  draft,
  @JsonValue('OPEN')
  open,
  @JsonValue('PAUSED')
  paused,
  @JsonValue('CLOSED')
  closed;

  String get displayName {
    switch (this) {
      case JobStatus.draft:
        return 'Draft';
      case JobStatus.open:
        return 'Open';
      case JobStatus.paused:
        return 'Paused';
      case JobStatus.closed:
        return 'Closed';
    }
  }
}

enum EmploymentType {
  @JsonValue('FULL_TIME')
  fullTime,
  @JsonValue('PART_TIME')
  partTime,
  @JsonValue('CONTRACT')
  contract,
  @JsonValue('INTERNSHIP')
  internship;

  String get displayName {
    switch (this) {
      case EmploymentType.fullTime:
        return 'Full Time';
      case EmploymentType.partTime:
        return 'Part Time';
      case EmploymentType.contract:
        return 'Contract';
      case EmploymentType.internship:
        return 'Internship';
    }
  }
}

enum ExperienceLevel {
  @JsonValue('ENTRY')
  entry,
  @JsonValue('MID')
  mid,
  @JsonValue('SENIOR')
  senior,
  @JsonValue('LEAD')
  lead;

  String get displayName {
    switch (this) {
      case ExperienceLevel.entry:
        return 'Entry Level';
      case ExperienceLevel.mid:
        return 'Mid Level';
      case ExperienceLevel.senior:
        return 'Senior';
      case ExperienceLevel.lead:
        return 'Lead';
    }
  }
}

enum ApplicationStatus {
  @JsonValue('APPLIED')
  applied,
  @JsonValue('AI_REVIEW')
  aiReview,
  @JsonValue('AI_RECOMMENDED')
  aiRecommended,
  @JsonValue('RECRUITER_REVIEW')
  recruiterReview,
  @JsonValue('INTERVIEW_APPROVED')
  interviewApproved,
  @JsonValue('INTERVIEW_SCHEDULED')
  interviewScheduled,
  @JsonValue('INTERVIEW_COMPLETED')
  interviewCompleted,
  @JsonValue('EVALUATION_PENDING')
  evaluationPending,
  @JsonValue('SELECTED')
  selected,
  @JsonValue('REJECTED')
  rejected;

  String get displayName {
    switch (this) {
      case ApplicationStatus.applied:
        return 'Applied';
      case ApplicationStatus.aiReview:
        return 'AI Review';
      case ApplicationStatus.aiRecommended:
        return 'AI Recommended';
      case ApplicationStatus.recruiterReview:
        return 'Recruiter Review';
      case ApplicationStatus.interviewApproved:
        return 'Interview Approved';
      case ApplicationStatus.interviewScheduled:
        return 'Interview Scheduled';
      case ApplicationStatus.interviewCompleted:
        return 'Interview Completed';
      case ApplicationStatus.evaluationPending:
        return 'Evaluation Pending';
      case ApplicationStatus.selected:
        return 'Selected';
      case ApplicationStatus.rejected:
        return 'Rejected';
    }
  }

  bool get isTerminal =>
      this == ApplicationStatus.selected || this == ApplicationStatus.rejected;

  bool get isActive => !isTerminal;
}

enum InterviewStatus {
  @JsonValue('SCHEDULED')
  scheduled,
  @JsonValue('IN_PROGRESS')
  inProgress,
  @JsonValue('COMPLETED')
  completed,
  @JsonValue('CANCELLED')
  cancelled,
  @JsonValue('NO_SHOW')
  noShow;

  String get displayName {
    switch (this) {
      case InterviewStatus.scheduled:
        return 'Scheduled';
      case InterviewStatus.inProgress:
        return 'In Progress';
      case InterviewStatus.completed:
        return 'Completed';
      case InterviewStatus.cancelled:
        return 'Cancelled';
      case InterviewStatus.noShow:
        return 'No Show';
    }
  }
}

enum NotificationType {
  @JsonValue('APPLICATION_UPDATE')
  applicationUpdate,
  @JsonValue('INTERVIEW_SCHEDULED')
  interviewScheduled,
  @JsonValue('AI_EVALUATION_COMPLETE')
  aiEvaluationComplete,
  @JsonValue('APPROVAL_REQUIRED')
  approvalRequired,
  @JsonValue('FEEDBACK_SUBMITTED')
  feedbackSubmitted,
  @JsonValue('GENERAL')
  general;

  String get displayName {
    switch (this) {
      case NotificationType.applicationUpdate:
        return 'Application Update';
      case NotificationType.interviewScheduled:
        return 'Interview Scheduled';
      case NotificationType.aiEvaluationComplete:
        return 'AI Evaluation Complete';
      case NotificationType.approvalRequired:
        return 'Approval Required';
      case NotificationType.feedbackSubmitted:
        return 'Feedback Submitted';
      case NotificationType.general:
        return 'Notification';
    }
  }
}
