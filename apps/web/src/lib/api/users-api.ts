import { apiClient } from '../api-client'
import type { ApiResponse, PagedResult, TeamMember, UserProfile, UserRole } from '@/types/auth'

export interface UserFilterParams {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  status?: string
  companyId?: string
}

export async function getUsers(params: UserFilterParams = {}): Promise<PagedResult<UserProfile>> {
  const res = await apiClient.get<ApiResponse<PagedResult<UserProfile>>>('/users', { params })
  return res.data.data ?? {
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  }
}

export async function getUserById(id: string): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>(`/users/${id}`)
  return res.data.data!
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserProfile> {
  const res = await apiClient.put<ApiResponse<UserProfile>>(`/users/${id}/role`, { role })
  return res.data.data!
}

export async function deactivateUser(id: string): Promise<boolean> {
  const res = await apiClient.put<ApiResponse<boolean>>(`/users/${id}/deactivate`)
  return res.data.data ?? true
}

export async function banUser(id: string, reason?: string): Promise<boolean> {
  const res = await apiClient.put<ApiResponse<boolean>>(`/users/${id}/ban`, { reason: reason || 'Violation of terms' })
  return res.data.data ?? true
}

export async function getTeamMembers(companyId?: string): Promise<TeamMember[]> {
  const params = companyId ? { companyId } : {}
  const res = await apiClient.get<ApiResponse<TeamMember[]>>('/users/team', { params })
  return res.data.data ?? []
}

export async function getInterviewers(companyId?: string): Promise<UserProfile[]> {
  const params = companyId ? { companyId } : {}
  const res = await apiClient.get<ApiResponse<UserProfile[]>>('/users/interviewers', { params })
  return res.data.data ?? []
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>('/users/me')
  return res.data.data!
}
