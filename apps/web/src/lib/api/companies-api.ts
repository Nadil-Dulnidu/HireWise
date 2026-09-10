import { apiClient } from '../api-client'
import type { ApiResponse, PagedResult } from '@/types/auth'

export interface Company {
  id: string
  clerkOrganizationId: string
  slug?: string
  name: string
  description?: string
  logoUrl?: string
  website?: string
  industry?: string
  size?: string
  location?: string
  createdByUserId?: string
  createdByName?: string
  employeeCount: number
  departmentCount: number
  activeJobCount: number
  createdAt: string
  updatedAt: string
}

export interface CompanyFilterParams {
  page?: number
  pageSize?: number
  search?: string
  industry?: string
}

export async function getCompanies(params: CompanyFilterParams = {}): Promise<PagedResult<Company>> {
  const res = await apiClient.get<ApiResponse<PagedResult<Company>>>('/companies', { params })
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

export async function getCompanyById(id: string): Promise<Company> {
  const res = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`)
  return res.data.data!
}
