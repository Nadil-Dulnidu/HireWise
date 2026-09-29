import { apiClient } from "../api-client";
import type { ApiResponse, PagedResult } from "@/types/auth";
import type {
  Application,
  ApplicationDetail,
  ApplyJobRequest,
  ChangeApplicationStatusRequest,
  ApplicationFilterRequest,
} from "@/types/applications";

// Readiness evaluation response indicating if candidate and interviewers have availability slots
export interface SchedulingReadiness {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  hasInterviewers: boolean;
  interviewerCount: number;
  hasInterviewerSlots: boolean;
  interviewerSlotCount: number;
  hasCandidateSlots: boolean;
  candidateSlotCount: number;
  canApprove: boolean;
  message?: string;
}

export const applicationsApi = {
  // Submit a candidate job application with optional cover letter
  applyToJob: async (jobId: string, data: ApplyJobRequest) => {
    const response = await apiClient.post<ApiResponse<Application>>(
      `/jobs/${jobId}/applications`,
      data,
    );
    return response.data.data;
  },

  // Fetch paginated applications submitted by current candidate
  getMyApplications: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PagedResult<Application>>>(
      "/applications/me",
      { params },
    );
    return response.data.data;
  },

  // Fetch detailed application information by ID
  getApplicationById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<ApplicationDetail>>(
      `/applications/${id}`,
    );
    return response.data.data;
  },

  // Check interviewer and candidate scheduling readiness for an application
  getSchedulingReadiness: async (id: string) => {
    const response = await apiClient.get<ApiResponse<SchedulingReadiness>>(
      `/applications/${id}/scheduling-readiness`,
    );
    return response.data.data;
  },

  // Fetch paginated applications submitted for a specific job
  getJobApplications: async (
    jobId: string,
    params?: ApplicationFilterRequest,
  ) => {
    const response = await apiClient.get<ApiResponse<PagedResult<Application>>>(
      `/jobs/${jobId}/applications`,
      { params },
    );
    return response.data.data;
  },

  // Fetch all applications across company job postings with optional filters
  getCompanyApplications: async (params?: ApplicationFilterRequest) => {
    const response = await apiClient.get<ApiResponse<PagedResult<Application>>>(
      "/applications",
      { params },
    );
    return response.data.data;
  },

  // Update status for a specific application
  updateApplicationStatus: async (
    id: string,
    data: ChangeApplicationStatusRequest,
  ) => {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/applications/${id}/status`,
      data,
    );
    return response.data.data;
  },

  // Approve application for technical interview scheduling
  approveForInterview: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/applications/${id}/approve-interview`,
    );
    return response.data.data;
  },

  // Reject a job application and notify applicant
  rejectApplication: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/applications/${id}/reject`,
    );
    return response.data.data;
  },
};

