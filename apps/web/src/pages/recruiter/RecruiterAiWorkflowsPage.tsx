import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { aiApi, type ApplicationWorkflowResponse, type StepResponse } from '@/lib/api/ai-api'
import {
  Activity,
  Bot,
  Cpu,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileCheck,
  Layers,
  ShieldCheck,
  CalendarCheck,
  Code2
} from 'lucide-react'

export function RecruiterAiWorkflowsPage() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)

  // 1. Fetch AI pipeline applications
  const { data: evaluations, isLoading: isListLoading, refetch: refetchList } = useQuery({
    queryKey: ['aiEvaluations'],
    queryFn: () => aiApi.getAiEvaluations()
  })

  // Auto-select first application with an AI workflow if none selected
  const activeAppId = selectedAppId || (evaluations && evaluations.length > 0 ? evaluations[0].id : null)

  // 2. Fetch selected application workflow
  const {
    data: appWorkflow,
    isLoading: isWorkflowLoading,
    refetch: refetchWorkflow
  } = useQuery<ApplicationWorkflowResponse>({
    queryKey: ['applicationWorkflow', activeAppId],
    queryFn: () => aiApi.getApplicationWorkflow(activeAppId!),
    enabled: !!activeAppId
  })

  const filteredEvaluations = (evaluations || []).filter((item) => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    return item.candidateName.toLowerCase().includes(term) || item.jobTitle.toLowerCase().includes(term)
  })

  const getAgentIcon = (agentName: string) => {
    switch (agentName.toLowerCase()) {
      case 'job_analyzer':
      case 'job_analysis':
        return FileCheck
      case 'resume_analyzer':
      case 'resume_analysis':
        return Bot
      case 'candidate_evaluator':
      case 'evaluation':
        return Layers
      case 'constraint_validator':
      case 'validation':
        return ShieldCheck
      case 'question_generator':
        return Sparkles
      case 'scheduling_agent':
        return CalendarCheck
      default:
        return Cpu
    }
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <Activity className="h-3.5 w-3.5" /> LangGraph Multi-Agent Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AI Workflow Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, step-by-step agent execution, deterministic schema validation, and token tracing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              refetchList()
              if (activeAppId) refetchWorkflow()
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-purple-600/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Application Selection) & Right Column (Workflow Telemetry) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Applications List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Evaluation Pipelines ({filteredEvaluations.length})
              </h3>
              <span className="text-[10px] text-purple-400 font-medium bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Live
              </span>
            </div>

            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates or jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {isListLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto" />
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 glass-card rounded-2xl border border-slate-800">
                No active workflows found.
              </div>
            ) : (
              filteredEvaluations.map((item) => {
                const isSelected = item.id === activeAppId

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAppId(item.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition space-y-2 ${
                      isSelected
                        ? 'bg-purple-950/25 border-purple-500/50 shadow-lg shadow-purple-950/40'
                        : 'glass-card border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white line-clamp-1">{item.candidateName}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          item.status === 'AI_RECOMMENDED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {item.status === 'AI_RECOMMENDED' ? 'Completed' : 'Evaluating'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.jobTitle}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>{new Date(item.appliedAt).toLocaleDateString()}</span>
                      <span className="text-purple-400 font-mono text-[9px]">ID: {item.id.slice(0, 8)}...</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Workflow Steps & Execution Visualizer (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {isWorkflowLoading ? (
            <div className="py-28 flex flex-col items-center justify-center space-y-3 glass-card rounded-3xl border border-slate-800">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-xs text-slate-400">Streaming LangGraph workflow graph...</p>
            </div>
          ) : !appWorkflow || !appWorkflow.workflow ? (
            <div className="p-12 text-center space-y-4 glass-card rounded-3xl border border-slate-800">
              <Bot className="h-12 w-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Workflow Telemetry Available</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select an application on the left to inspect its multi-agent evaluation execution trace.
              </p>
            </div>
          ) : (
            (() => {
              const wf = appWorkflow.workflow
              const steps: StepResponse[] = wf.steps || []

              return (
                <div className="space-y-6">
                  {/* Workflow Overview Banner */}
                  <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] pointer-events-none -z-10 rounded-full"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
                          <Activity className="h-3 w-3" /> StateGraph Pipeline
                        </div>
                        <h2 className="text-xl font-bold text-white">{appWorkflow.candidateName}</h2>
                        <p className="text-xs text-slate-400">Position: {appWorkflow.jobTitle}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-right">
                          <span className="text-[10px] text-slate-400 block font-medium uppercase">Workflow Status</span>
                          <span
                            className={`text-xs font-bold ${
                              wf.status === 'COMPLETED'
                                ? 'text-emerald-400'
                                : wf.status === 'AWAITING_APPROVAL'
                                ? 'text-amber-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {wf.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Workflow ID</span>
                        <span className="font-mono text-slate-300 text-[10px]">{wf.workflow_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Current Node</span>
                        <span className="font-semibold text-purple-400 text-xs">{wf.current_step}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Steps Executed</span>
                        <span className="font-semibold text-white text-xs">{steps.length} Nodes</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Created At</span>
                        <span className="text-slate-300 text-xs">{new Date(wf.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Agent Steps Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-400" /> Multi-Agent Execution Lifecycle
                    </h3>

                    {steps.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 glass-card rounded-2xl border border-slate-800">
                        Workflow is queued or running preliminary agent step.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {steps.map((step) => {
                          const IconComponent = getAgentIcon(step.agent_name)
                          const isExpanded = expandedStepId === step.id
                          const isCompleted = step.status === 'COMPLETED'

                          return (
                            <div
                              key={step.id}
                              className="glass-card rounded-2xl border border-slate-800 transition overflow-hidden"
                            >
                              {/* Step Header Accordion Toggle */}
                              <button
                                type="button"
                                onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition gap-4"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                      isCompleted
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}
                                  >
                                    <IconComponent className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                                        Step {step.step_order}
                                      </span>
                                      <span className="text-xs font-bold text-white">{step.step_name}</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 block font-mono">
                                      Agent: {step.agent_name}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isCompleted
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}
                                  >
                                    {step.status}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                              </button>

                              {/* Step Details & Structured Output */}
                              {isExpanded && (
                                <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] pt-3 text-slate-400">
                                    <div>
                                      <span className="text-slate-500 block">Retry Count</span>
                                      <span className="font-semibold text-white">{step.retry_count}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">Started</span>
                                      <span className="text-slate-300">
                                        {step.started_at ? new Date(step.started_at).toLocaleTimeString() : 'N/A'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block">Completed</span>
                                      <span className="text-slate-300">
                                        {step.completed_at ? new Date(step.completed_at).toLocaleTimeString() : 'In Progress'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Agent Output Data Payload */}
                                  {step.output_data && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                                        <span className="flex items-center gap-1.5">
                                          <Code2 className="h-3.5 w-3.5 text-purple-400" /> Structured Agent Output:
                                        </span>
                                      </div>
                                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-[11px] text-purple-300 font-mono overflow-x-auto max-h-60 leading-relaxed">
                                        {JSON.stringify(step.output_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Validation Result Payload */}
                                  {step.validation_result && (
                                    <div className="space-y-1.5">
                                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Deterministic Schema Validation:
                                      </span>
                                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-40 leading-relaxed">
                                        {JSON.stringify(step.validation_result, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()
          )}
        </div>
      </div>
    </div>
  )
}
