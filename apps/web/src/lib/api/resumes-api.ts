import { apiClient } from '../api-client'
import type { ApiResponse } from '@/types/auth'
import type { Resume, UploadResumeResponse } from '@/types/applications'

export const resumesApi = {
  uploadResume: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponse<UploadResumeResponse>>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  },

  getMyActiveResume: async () => {
    const response = await apiClient.get<ApiResponse<Resume>>('/resumes/me')
    return response.data.data
  },

  getResumeById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Resume>>(`/resumes/${id}`)
    return response.data.data
  },

  downloadResumeUrl: (id: string) => {
    return `/api/resumes/${id}/download`
  },

  deleteResume: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/resumes/${id}`)
    return response.data.data
  }
}
