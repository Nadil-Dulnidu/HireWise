import { apiClient } from '../api-client'
import type { ApiResponse } from '@/types/auth'

export interface AgentConfig {
  id: string
  agentKey: string
  name: string
  description: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  isActive: boolean
  updatedAt: string
}

export interface UpdateAgentConfigRequest {
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  isActive?: boolean
}

export interface PlatformSetting {
  id: string
  key: string
  value: string
  description: string
  category: string
  updatedAt: string
}

export async function getAgentConfigs(): Promise<AgentConfig[]> {
  const res = await apiClient.get<ApiResponse<AgentConfig[]>>('/agent-configs')
  return res.data.data ?? []
}

export async function updateAgentConfig(id: string, data: UpdateAgentConfigRequest): Promise<AgentConfig> {
  const res = await apiClient.put<ApiResponse<AgentConfig>>(`/agent-configs/${id}`, data)
  return res.data.data!
}

export async function resetAgentConfigs(): Promise<AgentConfig[]> {
  const res = await apiClient.post<ApiResponse<AgentConfig[]>>('/agent-configs/reset')
  return res.data.data ?? []
}

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const res = await apiClient.get<ApiResponse<PlatformSetting[]>>('/platform-settings')
  return res.data.data ?? []
}

export async function updatePlatformSettings(settings: Record<string, string>): Promise<PlatformSetting[]> {
  const res = await apiClient.put<ApiResponse<PlatformSetting[]>>('/platform-settings', { settings })
  return res.data.data ?? []
}
