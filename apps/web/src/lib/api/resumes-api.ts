import { apiClient } from "../api-client";
import type { ApiResponse } from "@/types/auth";
import type { Resume, UploadResumeResponse } from "@/types/applications";

export const resumesApi = {
  // Upload a resume file to the server using multipart form data
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<UploadResumeResponse>>(
      "/resumes/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },

  // Fetch the active resume for the current user
  getMyActiveResume: async () => {
    const response = await apiClient.get<ApiResponse<Resume>>("/resumes/me");
    return response.data.data;
  },

  // Fetch resume details by resume ID
  getResumeById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Resume>>(`/resumes/${id}`);
    return response.data.data;
  },

  // Build the relative download endpoint URL for a resume
  downloadResumeUrl: (id: string) => {
    return `/api/resumes/${id}/download`;
  },

  // Delete a resume by ID
  deleteResume: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/resumes/${id}`,
    );
    return response.data.data;
  },
};
