import { apiClient } from '../api-client'
import type { ApiResponse } from '@/types/auth'

export interface MonthlyMetric {
  month: string
  count: number
}

export interface IndustryDistribution {
  industry: string
  count: number
}

export interface RecentActivity {
  id: string
  action: string
  entityType: string
  role?: string
  createdAt: string
}

export interface PlatformStats {
  totalUsers: number
  totalCompanies: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  totalInterviews: number
  totalAiWorkflows: number
  usersByRole: Record<string, number>
  usersByStatus: Record<string, number>
  jobsByStatus: Record<string, number>
  applicationsByStatus: Record<string, number>
  interviewsByStatus: Record<string, number>
  aiWorkflowsByStatus: Record<string, number>
  monthlySignups: MonthlyMetric[]
  monthlyApplications: MonthlyMetric[]
  industryDistribution: IndustryDistribution[]
  recentActivities: RecentActivity[]
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await apiClient.get<ApiResponse<PlatformStats>>('/analytics/platform-stats')
  return res.data.data!
}
