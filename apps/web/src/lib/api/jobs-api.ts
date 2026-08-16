import { apiClient } from '../api-client'
import type {
  Job,
  JobSummary,
  JobStatus,
  Company,
  Department,
  CreateJobPayload,
  UpdateJobPayload,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  JobFilterParams
} from '@/types/jobs'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  timestamp: string
  correlationId?: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// Jobs API
export const jobsApi = {
  // Public & candidate job list (OPEN jobs only)
  getPublicJobs: async (params?: JobFilterParams): Promise<PagedResult<JobSummary>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<JobSummary>>>('/jobs', {
      params: { ...params, publicOnly: true }
    })
    return res.data.data
  },

  // Recruiter job list (all statuses for their company)
  getRecruiterJobs: async (params?: JobFilterParams): Promise<PagedResult<Job>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<Job>>>('/jobs', { params })
    return res.data.data
  },

  // Single job by ID
  getJobById: async (id: string): Promise<Job> => {
    const res = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`)
    return res.data.data
  },

  // Create new job posting
  createJob: async (payload: CreateJobPayload): Promise<Job> => {
    const res = await apiClient.post<ApiResponse<Job>>('/jobs', payload)
    return res.data.data
  },

  // Update existing job posting
  updateJob: async (id: string, payload: UpdateJobPayload): Promise<Job> => {
    const res = await apiClient.put<ApiResponse<Job>>(`/jobs/${id}`, payload)
    return res.data.data
  },

  // Update status (DRAFT -> OPEN -> PAUSED -> CLOSED)
  updateJobStatus: async (id: string, status: JobStatus): Promise<Job> => {
    const res = await apiClient.put<ApiResponse<Job>>(`/jobs/${id}/status`, { status })
    return res.data.data
  },

  // Delete job
  deleteJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`)
  }
}

// Companies API
export const companiesApi = {
  getCompanies: async (params?: { search?: string; industry?: string; page?: number; pageSize?: number }): Promise<PagedResult<Company>> => {
    const res = await apiClient.get<ApiResponse<PagedResult<Company>>>('/companies', { params })
    return res.data.data
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const res = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`)
    return res.data.data
  },

  createCompany: async (payload: CreateCompanyPayload): Promise<Company> => {
    const res = await apiClient.post<ApiResponse<Company>>('/companies', payload)
    return res.data.data
  },

  updateCompany: async (id: string, payload: UpdateCompanyPayload): Promise<Company> => {
    const res = await apiClient.put<ApiResponse<Company>>(`/companies/${id}`, payload)
    return res.data.data
  }
}

// Departments API
export const departmentsApi = {
  getDepartments: async (companyId: string): Promise<Department[]> => {
    const res = await apiClient.get<ApiResponse<Department[]>>(`/companies/${companyId}/departments`)
    return res.data.data
  },

  getDepartmentById: async (id: string): Promise<Department> => {
    const res = await apiClient.get<ApiResponse<Department>>(`/departments/${id}`)
    return res.data.data
  },

  createDepartment: async (companyId: string, payload: CreateDepartmentPayload): Promise<Department> => {
    const res = await apiClient.post<ApiResponse<Department>>(`/companies/${companyId}/departments`, payload)
    return res.data.data
  },

  updateDepartment: async (id: string, payload: UpdateDepartmentPayload): Promise<Department> => {
    const res = await apiClient.put<ApiResponse<Department>>(`/departments/${id}`, payload)
    return res.data.data
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`)
  }
}
