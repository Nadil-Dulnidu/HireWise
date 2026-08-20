import { apiClient } from '../api-client'

export interface AuditLogDto {
  id: string
  userId?: string
  userEmail?: string
  userName?: string
  role?: string
  action: string
  entityType: string
  entityId: string
  oldValuesJson?: string
  newValuesJson?: string
  ipAddress?: string
  correlationId?: string
  createdAt: string
}

export interface AuditLogFilterParams {
  page?: number
  pageSize?: number
  action?: string
  entityType?: string
  userId?: string
  fromDate?: string
  toDate?: string
  search?: string
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

export interface AuditLogMetadata {
  entityTypes: string[]
  actions: string[]
}

export const auditLogsApi = {
  getAuditLogs: async (params?: AuditLogFilterParams): Promise<PagedResult<AuditLogDto>> => {
    const res = await apiClient.get('/audit-logs', { params })
    return res.data.data
  },

  getAuditLogById: async (id: string): Promise<AuditLogDto> => {
    const res = await apiClient.get(`/audit-logs/${id}`)
    return res.data.data
  },

  getMetadata: async (): Promise<AuditLogMetadata> => {
    const res = await apiClient.get('/audit-logs/metadata')
    return res.data.data
  }
}
