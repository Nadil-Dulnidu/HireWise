import { apiClient } from "../api-client";
import type { ApiResponse, PagedResult } from "@/types/auth";
import type {
  Application,
  ApplicationDetail,
  ApplyJobRequest,
  ChangeApplicationStatusRequest,
  ApplicationFilterRequest,
} from "@/types/applications";

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
  applyToJob: async (jobId: string, data: ApplyJobRequest) => {
    const response = await apiClient.post<ApiResponse<Application>>(
      `/jobs/${jobId}/applications`,
      data,
    );
    return response.data.data;
  },

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

  getApplicationById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<ApplicationDetail>>(
      `/applications/${id}`,
    );
    return response.data.data;
  },

  getSchedulingReadiness: async (id: string) => {
    const response = await apiClient.get<ApiResponse<SchedulingReadiness>>(
      `/applications/${id}/scheduling-readiness`,
    );
    return response.data.data;
  },

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

  getCompanyApplications: async (params?: ApplicationFilterRequest) => {
    const response = await apiClient.get<ApiResponse<PagedResult<Application>>>(
      "/applications",
      { params },
    );
    return response.data.data;
  },

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

  approveForInterview: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/applications/${id}/approve-interview`,
    );
    return response.data.data;
  },

  rejectApplication: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/applications/${id}/reject`,
    );
    return response.data.data;
  },
};

