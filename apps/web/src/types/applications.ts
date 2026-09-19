import type { EmploymentType } from "./jobs";

export type ApplicationStatus =
  | "APPLIED"
  | "AI_REVIEW"
  | "AI_RECOMMENDED"
  | "RECRUITER_REVIEW"
  | "INTERVIEW_APPROVED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "EVALUATION_PENDING"
  | "SELECTED"
  | "REJECTED";

export interface Resume {
  id: string;
  candidateId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  isActive: boolean;
}

export interface UploadResumeResponse {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  message: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  jobEmploymentType: EmploymentType;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  resumeSnapshotUrl?: string;
  coverLetter?: string;
  aiWorkflowId?: string;
  appliedAt: string;
  createdAt: string;
}

export interface ApplicationDetail extends Application {
  jobDescription: string;
  jobRequirements: string;
  jobSalaryMin?: number;
  jobSalaryMax?: number;
  jobSalaryCurrency: string;
  candidatePhone?: string;
  candidateProfileImageUrl?: string;
  hasInterviewScheduled: boolean;
  interviewId?: string;
}

export interface ApplyJobRequest {
  coverLetter?: string;
}

export interface ChangeApplicationStatusRequest {
  status: ApplicationStatus;
  notes?: string;
}

export interface ApplicationFilterRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  jobId?: string;
  candidateId?: string;
  companyId?: string;
  status?: ApplicationStatus;
}
