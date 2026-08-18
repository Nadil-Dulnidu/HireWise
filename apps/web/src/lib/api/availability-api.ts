import { apiClient } from '../api-client'
import type { ApiResponse } from '@/types/auth'
import type {
  AvailabilitySlot,
  CreateAvailabilitySlotRequest,
  UpdateAvailabilitySlotRequest,
  BulkCreateAvailabilityRequest
} from '@/types/interviews'

export const availabilityApi = {
  getMyAvailability: async () => {
    const response = await apiClient.get<ApiResponse<AvailabilitySlot[]>>('/availability/me')
    return response.data.data ?? []
  },

  createSlot: async (data: CreateAvailabilitySlotRequest) => {
    const response = await apiClient.post<ApiResponse<AvailabilitySlot>>('/availability', data)
    return response.data.data
  },

  bulkCreateSlots: async (data: BulkCreateAvailabilityRequest) => {
    const response = await apiClient.post<ApiResponse<AvailabilitySlot[]>>('/availability/bulk', data)
    return response.data.data ?? []
  },

  updateSlot: async (id: string, data: UpdateAvailabilitySlotRequest) => {
    const response = await apiClient.put<ApiResponse<AvailabilitySlot>>(`/availability/${id}`, data)
    return response.data.data
  },

  deleteSlot: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<object>>(`/availability/${id}`)
    return response.data.data
  },

  getInterviewerAvailability: async (interviewerId: string) => {
    const response = await apiClient.get<ApiResponse<AvailabilitySlot[]>>(`/availability/interviewer/${interviewerId}`)
    return response.data.data ?? []
  }
}
