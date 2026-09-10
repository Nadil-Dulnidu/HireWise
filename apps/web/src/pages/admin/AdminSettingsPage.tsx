import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Bot,
  Sliders,
  RefreshCw,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Globe,
  Mail,
  Clock,
  UserPlus,
  Cpu
} from 'lucide-react'
import {
  getAgentConfigs,
  updateAgentConfig,
  resetAgentConfigs,
  getPlatformSettings,
  updatePlatformSettings,
  type UpdateAgentConfigRequest
} from '@/lib/api/admin-settings-api'


export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'agents' | 'general'>('agents')

  // Status message for feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3500)
  }

  // --- AGENT CONFIGS QUERY & MUTATIONS ---
  const {
    data: agentConfigs = [],
    isLoading: isAgentsLoading,
    refetch: refetchAgents
  } = useQuery({
    queryKey: ['admin-agent-configs'],
    queryFn: getAgentConfigs
  })

  // Local state for editing agent configs
  const [agentFormState, setAgentFormState] = useState<Record<string, UpdateAgentConfigRequest>>({})

  useEffect(() => {
    if (agentConfigs.length > 0) {
      const initial: Record<string, UpdateAgentConfigRequest> = {}
      agentConfigs.forEach((c) => {
        initial[c.id] = {
          model: c.model,
          systemPrompt: c.systemPrompt,
          temperature: c.temperature,
          maxTokens: c.maxTokens,
          isActive: c.isActive
        }
      })
      setAgentFormState(initial)
    }
  }, [agentConfigs])

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentConfigRequest }) => updateAgentConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agent-configs'] })
      showFeedback('success', 'Agent configuration updated and persisted to database.')
    },
    onError: () => {
      showFeedback('error', 'Failed to update agent configuration.')
    }
  })

  const resetAgentsMutation = useMutation({
    mutationFn: resetAgentConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agent-configs'] })
      showFeedback('success', 'All agent configurations have been reset to factory defaults.')
    }
  })

  // --- PLATFORM SETTINGS QUERY & MUTATION ---
  const {
    data: platformSettings = [],
    isLoading: isSettingsLoading,
    refetch: refetchSettings
  } = useQuery({
    queryKey: ['admin-platform-settings'],
    queryFn: getPlatformSettings
  })

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (platformSettings.length > 0) {
      const form: Record<string, string> = {}
      platformSettings.forEach((s) => {
        form[s.key] = s.value
      })
      setSettingsForm(form)
    }
  }, [platformSettings])

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Record<string, string>) => updatePlatformSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-settings'] })
      showFeedback('success', 'Platform settings saved successfully.')
    },
    onError: () => {
      showFeedback('error', 'Failed to save platform settings.')
    }
  })

  const handleAgentFieldChange = (id: string, field: keyof UpdateAgentConfigRequest, value: any) => {
    setAgentFormState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleSaveAgent = (id: string) => {
    const configData = agentFormState[id]
    if (!configData) return
    updateAgentMutation.mutate({ id, data: configData })
  }

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettingsMutation.mutate(settingsForm)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Settings className="h-7 w-7 text-indigo-600" />
            System & Agent Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure multi-agent LLM parameters, system prompts, token limits, and global recruitment operations.
          </p>
        </div>

        {feedback && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            {feedback.message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'agents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="h-4 w-4" />
          AI Agent Configurations ({agentConfigs.length})
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          General Platform Settings
        </button>
      </div>

      {/* TAB 1: AI AGENTS */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Each specialized recruitment agent reads parameters from PostgreSQL at runtime. Falling back to code defaults if DB is unavailable.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetchAgents()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all agent prompts and settings to factory defaults?')) {
                    resetAgentsMutation.mutate()
                  }
                }}
                disabled={resetAgentsMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 shadow-xs transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Defaults
              </button>
            </div>
          </div>

          {isAgentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-4">
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-64 bg-slate-100 rounded" />
                  <div className="h-20 bg-slate-50 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agentConfigs.map((agent) => {
                const form = agentFormState[agent.id] || {
                  model: agent.model,
                  systemPrompt: agent.systemPrompt,
                  temperature: agent.temperature,
                  maxTokens: agent.maxTokens,
                  isActive: agent.isActive
                }

                return (
                  <div
                    key={agent.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{agent.name}</h3>
                            <span className="text-[11px] font-mono text-slate-400">key: {agent.agentKey}</span>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={form.isActive ?? true}
                            onChange={(e) => handleAgentFieldChange(agent.id, 'isActive', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>Active</span>
                        </label>
                      </div>

                      <p className="text-xs text-slate-500 mb-4">{agent.description}</p>

                      {/* Config Fields */}
                      <div className="space-y-4">
                        {/* Model & Max Tokens */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              LLM Model
                            </label>
                            <select
                              value={form.model ?? 'gemini-1.5-pro'}
                              onChange={(e) => handleAgentFieldChange(agent.id, 'model', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                            >
                              <option value="gemini-1.5-pro">gemini-1.5-pro (Reasoning)</option>
                              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast)</option>
                              <option value="gemini-2.0-flash">gemini-2.0-flash (NextGen)</option>
                              <option value="gemini-1.0-pro">gemini-1.0-pro (Legacy)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Max Tokens
                            </label>
                            <input
                              type="number"
                              min={128}
                              max={16384}
                              step={128}
                              value={form.maxTokens ?? 4096}
                              onChange={(e) =>
                                handleAgentFieldChange(agent.id, 'maxTokens', parseInt(e.target.value) || 2048)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                            />
                          </div>
                        </div>

                        {/* Temperature Slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-semibold text-slate-600">
                              Creativity / Temperature
                            </label>
                            <span className="text-[11px] font-mono text-indigo-600 font-bold">
                              {form.temperature?.toFixed(2) ?? '0.20'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.0}
                            max={1.0}
                            step={0.05}
                            value={form.temperature ?? 0.2}
                            onChange={(e) =>
                              handleAgentFieldChange(agent.id, 'temperature', parseFloat(e.target.value))
                            }
                            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>0.0 (Deterministic)</span>
                            <span>1.0 (Creative)</span>
                          </div>
                        </div>

                        {/* System Prompt */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            System Prompt Directive
                          </label>
                          <textarea
                            rows={6}
                            value={form.systemPrompt ?? ''}
                            onChange={(e) => handleAgentFieldChange(agent.id, 'systemPrompt', e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition leading-relaxed resize-y"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Updated: {new Date(agent.updatedAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => handleSaveAgent(agent.id)}
                        disabled={updateAgentMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Agent
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">General Platform Operations</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Universal configuration defaults applied across candidate application portals and notifications.
                </p>
              </div>

              <button
                onClick={() => refetchSettings()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>

            {isSettingsLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSaveGeneralSettings} className="space-y-5">
                {/* Platform Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm['PlatformName'] ?? ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, PlatformName: e.target.value }))
                    }
                    placeholder="HireWise Recruitment Platform"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Brand name displayed in navigation bars, emails, and interview invitations.
                  </span>
                </div>

                {/* Support Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm['SupportEmail'] ?? ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, SupportEmail: e.target.value }))
                    }
                    placeholder="support@hirewise.dev"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Contact address linked in candidate error pages and system communications.
                  </span>
                </div>

                {/* Default Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Default Scheduling Timezone
                  </label>
                  <select
                    value={settingsForm['DefaultTimezone'] ?? 'UTC'}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, DefaultTimezone: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>

                {/* Max Applications */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Concurrent Applications Per Candidate
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settingsForm['MaxApplicationsPerCandidate'] ?? '10'}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        MaxApplicationsPerCandidate: e.target.value
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                </div>

                {/* Candidate Self Registration Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                      Candidate Self-Registration
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Permit prospective candidates to create self-service accounts without prior invite.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm['CandidateSelfRegistration'] === 'true'}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          CandidateSelfRegistration: e.target.checked ? 'true' : 'false'
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* AI Guardrails Enforcement Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-purple-600" />
                      Enforce AI Validation Guardrails
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Block agent artifacts that violate schema bounds, hallucination heuristics, or bias rules.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm['EnableAiValidationGuardrails'] === 'true'}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          EnableAiValidationGuardrails: e.target.checked ? 'true' : 'false'
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save General Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
