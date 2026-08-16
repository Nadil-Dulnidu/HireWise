export type UserRole = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE'

export type UserStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE'

export interface UserProfile {
  id: string
  clerkUserId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  status: UserStatus
  companyId?: string
  companyName?: string
  profileImageUrl?: string
  phone?: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
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
