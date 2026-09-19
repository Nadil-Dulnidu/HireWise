import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Cpu,
} from "lucide-react";
import {
  getAgentConfigs,
  updateAgentConfig,
  resetAgentConfigs,
  getPlatformSettings,
  updatePlatformSettings,
  type UpdateAgentConfigRequest,
  type AgentConfig,
} from "@/lib/api/admin-settings-api";

// Generally Available Gemini models accessible via Google Cloud Gemini Enterprise Agent Platform
const AVAILABLE_GEMINI_MODELS = [
  {
    group: "Gemini 2.5 Series (Current Generation)",
    models: [
      {
        value: "gemini-2.5-flash",
        label: "gemini-2.5-flash (Recommended: Fast Reasoning & High Throughput)",
      },
      {
        value: "gemini-2.5-pro",
        label: "gemini-2.5-pro (Deep Reasoning & Complex Evaluation)",
      },
    ],
  },
  {
    group: "Gemini 1.5 Series (Stable Long-Context)",
    models: [
      {
        value: "gemini-1.5-flash",
        label: "gemini-1.5-flash (High Throughput Baseline)",
      },
      {
        value: "gemini-1.5-pro",
        label: "gemini-1.5-pro (Extended Context & Code Analysis)",
      },
    ],
  },
];

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"agents" | "general">("agents");

  // Status message for feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // --- AGENT CONFIGS QUERY & MUTATIONS ---
  const {
    data: agentConfigs = [],
    isLoading: isAgentsLoading,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ["admin-agent-configs"],
    queryFn: getAgentConfigs,
  });

  // Local draft state for editing agent configs (stores only user modifications)
  const [agentDrafts, setAgentDrafts] = useState<
    Record<string, Partial<UpdateAgentConfigRequest>>
  >({});

  const updateAgentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAgentConfigRequest;
    }) => updateAgentConfig(id, data),
    onSuccess: (_data, variables) => {
      setAgentDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-agent-configs"] });
      showFeedback(
        "success",
        "Agent configuration updated and persisted to database.",
      );
    },
    onError: () => {
      showFeedback("error", "Failed to update agent configuration.");
    },
  });

  const resetAgentsMutation = useMutation({
    mutationFn: resetAgentConfigs,
    onSuccess: () => {
      setAgentDrafts({});
      queryClient.invalidateQueries({ queryKey: ["admin-agent-configs"] });
      showFeedback(
        "success",
        "All agent configurations have been reset to factory defaults.",
      );
    },
  });

  // --- PLATFORM SETTINGS QUERY & MUTATION ---
  const {
    data: platformSettings = [],
    isLoading: isSettingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["admin-platform-settings"],
    queryFn: getPlatformSettings,
  });

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (platformSettings.length > 0) {
      const form: Record<string, string> = {};
      platformSettings.forEach((s) => {
        form[s.key] = s.value;
      });
      setSettingsForm(form);
    }
  }, [platformSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Record<string, string>) =>
      updatePlatformSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-platform-settings"] });
      showFeedback("success", "Platform settings saved successfully.");
    },
    onError: () => {
      showFeedback("error", "Failed to save platform settings.");
    },
  });

  const handleAgentFieldChange = (
    id: string,
    field: keyof UpdateAgentConfigRequest,
    value: any,
  ) => {
    setAgentDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveAgent = (agent: AgentConfig) => {
    const agentId = agent.id || (agent as any).Id;
    const draft = agentDrafts[agentId] || {};
    const payload: UpdateAgentConfigRequest = {
      model: draft.model ?? agent.model ?? (agent as any).Model,
      systemPrompt:
        draft.systemPrompt ?? agent.systemPrompt ?? (agent as any).SystemPrompt,
      temperature:
        draft.temperature ?? agent.temperature ?? (agent as any).Temperature,
      maxTokens:
        draft.maxTokens ?? agent.maxTokens ?? (agent as any).MaxTokens,
      isActive:
        draft.isActive ?? agent.isActive ?? (agent as any).IsActive ?? true,
    };
    updateAgentMutation.mutate({ id: agentId, data: payload });
  };

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

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
            Configure multi-agent LLM parameters, system prompts, token limits,
            and global recruitment operations.
          </p>
        </div>

        {feedback && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
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
          onClick={() => setActiveTab("agents")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === "agents"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bot className="h-4 w-4" />
          AI Agent Configurations ({agentConfigs.length})
        </button>

        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === "general"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="h-4 w-4" />
          General Platform Settings
        </button>
      </div>

      {/* TAB 1: AI AGENTS */}
      {activeTab === "agents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Each specialized recruitment agent reads parameters from
              PostgreSQL at runtime. Falling back to code defaults if DB is
              unavailable.
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
                  if (
                    confirm(
                      "Are you sure you want to reset all agent prompts and settings to factory defaults?",
                    )
                  ) {
                    resetAgentsMutation.mutate();
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
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-4"
                >
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-64 bg-slate-100 rounded" />
                  <div className="h-20 bg-slate-50 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agentConfigs.map((agent) => {
                const agentId = agent.id || (agent as any).Id;
                const draft = agentDrafts[agentId] || {};
                const dbModel = agent.model || (agent as any).Model;
                const activeModel = draft.model ?? dbModel ?? "gemini-3.5-flash";
                const activeSystemPrompt =
                  draft.systemPrompt ??
                  agent.systemPrompt ??
                  (agent as any).SystemPrompt ??
                  "";
                const activeTemperature =
                  draft.temperature ??
                  agent.temperature ??
                  (agent as any).Temperature ??
                  0.2;
                const activeMaxTokens =
                  draft.maxTokens ??
                  agent.maxTokens ??
                  (agent as any).MaxTokens ??
                  4096;
                const activeIsActive =
                  draft.isActive ??
                  agent.isActive ??
                  (agent as any).IsActive ??
                  true;
                const isDirty = Boolean(
                  agentDrafts[agentId] &&
                    Object.keys(agentDrafts[agentId]).length > 0,
                );

                return (
                  <div
                    key={agentId}
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
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">
                                {agent.name || (agent as any).Name}
                              </h3>
                              {isDirty && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  Unsaved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] font-mono text-slate-400">
                                key: {agent.agentKey || (agent as any).AgentKey}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                                DB: {dbModel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={activeIsActive}
                            onChange={(e) =>
                              handleAgentFieldChange(
                                agentId,
                                "isActive",
                                e.target.checked,
                              )
                            }
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>Active</span>
                        </label>
                      </div>

                      <p className="text-xs text-slate-500 mb-4">
                        {agent.description || (agent as any).Description}
                      </p>

                      {/* Config Fields */}
                      <div className="space-y-4">
                        {/* Model & Max Tokens */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              LLM Model
                            </label>
                            <select
                              value={activeModel}
                              onChange={(e) =>
                                handleAgentFieldChange(
                                  agentId,
                                  "model",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer font-medium"
                            >
                              {AVAILABLE_GEMINI_MODELS.map((group) => (
                                <optgroup key={group.group} label={group.group}>
                                  {group.models.map((model) => (
                                    <option
                                      key={model.value}
                                      value={model.value}
                                    >
                                      {model.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                              {activeModel &&
                                !AVAILABLE_GEMINI_MODELS.some((g) =>
                                  g.models.some(
                                    (m) =>
                                      m.value.toLowerCase() ===
                                      activeModel.toLowerCase(),
                                  ),
                                ) && (
                                  <optgroup label="Current / Custom Model">
                                    <option value={activeModel}>
                                      {activeModel} (Custom)
                                    </option>
                                  </optgroup>
                                )}
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
                              value={activeMaxTokens}
                              onChange={(e) =>
                                handleAgentFieldChange(
                                  agentId,
                                  "maxTokens",
                                  parseInt(e.target.value) || 2048,
                                )
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
                              {activeTemperature.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.0}
                            max={1.0}
                            step={0.05}
                            value={activeTemperature}
                            onChange={(e) =>
                              handleAgentFieldChange(
                                agentId,
                                "temperature",
                                parseFloat(e.target.value),
                              )
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
                            value={activeSystemPrompt}
                            onChange={(e) =>
                              handleAgentFieldChange(
                                agentId,
                                "systemPrompt",
                                e.target.value,
                              )
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition leading-relaxed resize-y"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Updated:{" "}
                        {new Date(
                          agent.updatedAt ||
                            (agent as any).UpdatedAt ||
                            Date.now(),
                        ).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => handleSaveAgent(agent)}
                        disabled={updateAgentMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50 ${
                          isDirty
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-300"
                            : "bg-slate-800 hover:bg-slate-900 text-white"
                        }`}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {isDirty ? "Save Changes" : "Save Agent"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {activeTab === "general" && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  General Platform Operations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Universal configuration defaults applied across candidate
                  application portals and notifications.
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
                    value={settingsForm["PlatformName"] ?? ""}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        PlatformName: e.target.value,
                      }))
                    }
                    placeholder="HireWise Recruitment Platform"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Brand name displayed in navigation bars, emails, and
                    interview invitations.
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
                    value={settingsForm["SupportEmail"] ?? ""}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        SupportEmail: e.target.value,
                      }))
                    }
                    placeholder="support@hirewise.dev"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Contact address linked in candidate error pages and system
                    communications.
                  </span>
                </div>

                {/* Default Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Default Scheduling Timezone
                  </label>
                  <select
                    value={settingsForm["DefaultTimezone"] ?? "UTC"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        DefaultTimezone: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="UTC">
                      UTC (Coordinated Universal Time)
                    </option>
                    <option value="America/New_York">
                      America/New_York (EST/EDT)
                    </option>
                    <option value="America/Los_Angeles">
                      America/Los_Angeles (PST/PDT)
                    </option>
                    <option value="Europe/London">
                      Europe/London (GMT/BST)
                    </option>
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
                    value={settingsForm["MaxApplicationsPerCandidate"] ?? "10"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        MaxApplicationsPerCandidate: e.target.value,
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
                      Permit prospective candidates to create self-service
                      accounts without prior invite.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        settingsForm["CandidateSelfRegistration"] === "true"
                      }
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          CandidateSelfRegistration: e.target.checked
                            ? "true"
                            : "false",
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
                      Block agent artifacts that violate schema bounds,
                      hallucination heuristics, or bias rules.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        settingsForm["EnableAiValidationGuardrails"] === "true"
                      }
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          EnableAiValidationGuardrails: e.target.checked
                            ? "true"
                            : "false",
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
                    {updateSettingsMutation.isPending
                      ? "Saving..."
                      : "Save General Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
