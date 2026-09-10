import { apiClient } from "../api-client";
import type { ApiResponse, PagedResult } from "@/types/auth";
import type {
  Interview,
  InterviewDetail,
  InterviewFeedback,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  SubmitFeedbackRequest,
  UpdateFeedbackRequest,
  InterviewFilterRequest,
} from "@/types/interviews";

export const interviewsApi = {
  createInterview: async (data: CreateInterviewRequest) => {
    const response = await apiClient.post<ApiResponse<Interview>>(
      "/interviews",
      data,
    );
    return response.data.data;
  },

  getInterviews: async (params?: InterviewFilterRequest) => {
    const response = await apiClient.get<ApiResponse<PagedResult<Interview>>>(
      "/interviews",
      { params },
    );
    return response.data.data;
  },

  getMyInterviews: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PagedResult<Interview>>>(
      "/interviews/me",
      { params },
    );
    return response.data.data;
  },

  getInterviewById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<InterviewDetail>>(
      `/interviews/${id}`,
    );
    return response.data.data;
  },

  updateInterview: async (id: string, data: UpdateInterviewRequest) => {
    const response = await apiClient.put<ApiResponse<Interview>>(
      `/interviews/${id}`,
      data,
    );
    return response.data.data;
  },

  cancelInterview: async (id: string, reason?: string) => {
    const response = await apiClient.put<ApiResponse<Interview>>(
      `/interviews/${id}/cancel`,
      reason ?? "",
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return response.data.data;
  },

  completeInterview: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Interview>>(
      `/interviews/${id}/complete`,
    );
    return response.data.data;
  },

  submitFeedback: async (interviewId: string, data: SubmitFeedbackRequest) => {
    const response = await apiClient.post<ApiResponse<InterviewFeedback>>(
      `/interviews/${interviewId}/feedback`,
      data,
    );
    return response.data.data;
  },

  getFeedback: async (interviewId: string) => {
    const response = await apiClient.get<ApiResponse<InterviewFeedback>>(
      `/interviews/${interviewId}/feedback`,
    );
    return response.data.data;
  },

  updateFeedback: async (feedbackId: string, data: UpdateFeedbackRequest) => {
    const response = await apiClient.put<ApiResponse<InterviewFeedback>>(
      `/feedback/${feedbackId}`,
      data,
    );
    return response.data.data;
  },
};
