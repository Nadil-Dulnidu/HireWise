import { apiClient } from '../api-client'
import type { ApiResponse, TeamMember, UserProfile } from '@/types/auth'

export async function getTeamMembers(companyId?: string): Promise<TeamMember[]> {
  const params = companyId ? { companyId } : {}
  const res = await apiClient.get<ApiResponse<TeamMember[]>>('/api/users/team', { params })
  return res.data.data ?? []
}

export async function getInterviewers(companyId?: string): Promise<UserProfile[]> {
  const params = companyId ? { companyId } : {}
  const res = await apiClient.get<ApiResponse<UserProfile[]>>('/api/users/interviewers', { params })
  return res.data.data ?? []
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>('/api/users/me')
  return res.data.data!
}
