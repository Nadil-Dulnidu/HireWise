import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { aiApi, type ApplicationWorkflowResponse, type GeneratedQuestion } from '@/lib/api/ai-api'
import { applicationsApi } from '@/lib/api/applications-api'
import {
  Sparkles,
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Eye,
  Search,
  User,
  Award,
  ArrowRight,
  TrendingUp,
  Filter,
  X,
  FileSpreadsheet
} from 'lucide-react'

export function RecruiterAiEvaluationsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'AI_RECOMMENDED' | 'AI_REVIEW'>('ALL')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'questions'>('overview')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // 1. Fetch AI Evaluations list
  const { data: evaluations, isLoading, isError, refetch } = useQuery({
    queryKey: ['aiEvaluations', selectedStatusFilter],
    queryFn: () =>
      aiApi.getAiEvaluations({
        statusFilter: selectedStatusFilter === 'ALL' ? undefined : selectedStatusFilter
      })
  })

  // 2. Fetch selected application's detailed AI workflow if modal is open
  const { data: appWorkflow, isLoading: isWorkflowLoading } = useQuery<ApplicationWorkflowResponse>({
    queryKey: ['applicationWorkflow', selectedAppId],
    queryFn: () => aiApi.getApplicationWorkflow(selectedAppId!),
    enabled: !!selectedAppId
  })

  // 3. Trigger manual evaluation mutation
  const triggerEvalMutation = useMutation({
    mutationFn: (applicationId: string) => aiApi.triggerEvaluation(applicationId),
    onSuccess: () => {
      setActionError(null)
      setActionSuccess('AI evaluation workflow successfully triggered! Results will update momentarily.')
      queryClient.invalidateQueries({ queryKey: ['aiEvaluations'] })
      setTimeout(() => setActionSuccess(null), 4000)
    },
    onError: (err: any) => {
      setActionSuccess(null)
      setActionError(err?.response?.data?.error || err.message || 'Failed to trigger evaluation')
    }
  })

  // 4. Approve for interview mutation
  const approveMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsApi.approveForInterview(applicationId),
    onSuccess: () => {
      setActionError(null)
      setActionSuccess('Candidate approved for technical interview scheduling!')
      queryClient.invalidateQueries({ queryKey: ['aiEvaluations'] })
      setTimeout(() => setActionSuccess(null), 4000)
    },
    onError: (err: any) => {
      setActionSuccess(null)
      setActionError(err?.response?.data?.error || err.message || 'Failed to approve application')
    }
  })

  // 5. Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => applicationsApi.rejectApplication(applicationId),
    onSuccess: () => {
      setActionError(null)
      setActionSuccess('Application marked as rejected.')
      queryClient.invalidateQueries({ queryKey: ['aiEvaluations'] })
      setTimeout(() => setActionSuccess(null), 4000)
    },
    onError: (err: any) => {
      setActionSuccess(null)
      setActionError(err?.response?.data?.error || err.message || 'Failed to reject application')
    }
  })

  const filteredEvaluations = (evaluations || []).filter((item) => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    return (
      item.candidateName.toLowerCase().includes(term) ||
      item.jobTitle.toLowerCase().includes(term) ||
      item.candidateEmail.toLowerCase().includes(term)
    )
  })

  const totalEvaluated = evaluations?.length || 0
  const recommendedCount = evaluations?.filter((e) => e.status === 'AI_RECOMMENDED').length || 0
  const inReviewCount = evaluations?.filter((e) => e.status === 'AI_REVIEW').length || 0

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> LangGraph Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AI Candidate Evaluations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous multi-agent resume parsing, scoring rubrics, gap detection, and tailored interview questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/ai-workflows"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
          >
            <Bot className="h-4 w-4 text-purple-400" /> Multi-Agent Monitor
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-purple-600/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Results
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-400 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total AI Pipeline</span>
            <Bot className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalEvaluated}</div>
          <p className="text-[11px] text-slate-500">Processed through 6-agent LangGraph engine</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>AI Recommended</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-300">{recommendedCount}</div>
          <p className="text-[11px] text-emerald-500/80">Candidates meeting skill and experience thresholds</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-purple-500/20 bg-purple-950/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
            <span>Active Reviews</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-300">{inReviewCount}</div>
          <p className="text-[11px] text-purple-500/80">Currently in multi-agent analysis or awaiting decision</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by candidate name, email, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0 pl-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" /> Filter:
          </span>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-[11px] ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('AI_RECOMMENDED')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-[11px] ${
                selectedStatusFilter === 'AI_RECOMMENDED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recommended
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('AI_REVIEW')}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-[11px] ${
                selectedStatusFilter === 'AI_REVIEW'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In Review
            </button>
          </div>
        </div>
      </div>

      {/* Evaluations List */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-xs text-slate-400">Loading AI evaluation pipeline...</p>
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl glass-card border border-red-500/30 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Failed to load evaluations</h3>
          <p className="text-xs text-slate-400">Ensure the backend API and AI Service are running.</p>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="p-12 rounded-3xl glass-card border border-slate-800 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 mx-auto border border-purple-500/20">
            <Bot className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white">No AI Evaluations Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When candidates submit applications to your job postings, the autonomous LangGraph pipeline will analyze their CVs and display fit scoring here.
          </p>
          <Link
            to="/recruiter/applications"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-purple-400" /> View All Applications
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvaluations.map((item) => {
            const isRecommended = item.status === 'AI_RECOMMENDED'
            const isReview = item.status === 'AI_REVIEW'

            return (
              <div
                key={item.id}
                className={`glass-card rounded-2xl p-6 border transition space-y-5 flex flex-col justify-between ${
                  isRecommended
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isReview
                    ? 'border-blue-500/30 hover:border-blue-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Status & Job */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block">
                        {item.companyName}
                      </span>
                      <h3 className="text-base font-bold text-white line-clamp-1">{item.jobTitle}</h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        isRecommended
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isReview
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isRecommended ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Recommended
                        </>
                      ) : isReview ? (
                        <>
                          <Clock className="h-3 w-3" /> AI Review
                        </>
                      ) : (
                        item.status
                      )}
                    </span>
                  </div>

                  {/* Candidate Info */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      <span>{item.candidateName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate pl-5.5">{item.candidateEmail}</p>
                    <p className="text-[10px] text-slate-500 pl-5.5">
                      Applied on {new Date(item.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAppId(item.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 px-3 py-2 text-xs font-semibold text-purple-300 transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> AI Analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerEvalMutation.mutate(item.id)}
                      disabled={triggerEvalMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${triggerEvalMutation.isPending ? 'animate-spin' : ''}`} /> Re-evaluate
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(item.id)}
                      disabled={approveMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* AI Evaluation Deep-Dive Modal */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-4xl rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAppId(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {isWorkflowLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-xs text-slate-400">Fetching LangGraph evaluation payload...</p>
              </div>
            ) : !appWorkflow || !appWorkflow.workflow ? (
              <div className="py-12 text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Evaluation in Progress</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The AI multi-agent workflow is still executing for this candidate. You can monitor its live execution state in the Multi-Agent Monitor.
                </p>
                <div className="pt-3">
                  <Link
                    to="/recruiter/ai-workflows"
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition"
                  >
                    Open Multi-Agent Monitor <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              (() => {
                const evalData = appWorkflow.workflow.final_result?.evaluation
                const resumeData = appWorkflow.workflow.final_result?.resume_analysis
                const questionsData: GeneratedQuestion[] =
                  appWorkflow.workflow.final_result?.questions?.questions || []

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-400 mb-1">
                          <Bot className="h-3 w-3" /> Multi-Agent Candidate Assessment
                        </div>
                        <h2 className="text-xl font-bold text-white">{appWorkflow.candidateName}</h2>
                        <p className="text-xs text-slate-400">Position: {appWorkflow.jobTitle}</p>
                      </div>

                      {evalData && (
                        <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium uppercase">Fit Score</span>
                            <span className="text-2xl font-extrabold text-emerald-400">
                              {evalData.overall_match_score}%
                            </span>
                          </div>
                          <div className="h-10 w-px bg-slate-800"></div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium uppercase">Recommendation</span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                evalData.recommendation === 'STRONG_HIRE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : evalData.recommendation === 'HIRE'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {evalData.recommendation.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                          activeTab === 'overview'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        Assessment Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('skills')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                          activeTab === 'skills'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        Extracted Skills & Experience ({resumeData?.extracted_skills?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('questions')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                          activeTab === 'questions'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        AI Generated Questions ({questionsData.length})
                      </button>
                    </div>

                    {/* Tab 1: Overview */}
                    {activeTab === 'overview' && evalData && (
                      <div className="space-y-6">
                        {/* Reasoning Quote */}
                        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1.5">
                          <h4 className="text-xs font-semibold text-purple-300 flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" /> AI Recommendation Rationale
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {evalData.recommendation_reasoning}
                          </p>
                        </div>

                        {/* Match Percentages Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-300">Technical Skill Match</span>
                              <span className="text-blue-400">{evalData.skill_match_percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${evalData.skill_match_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-300">Experience Alignment</span>
                              <span className="text-purple-400">{evalData.experience_match_percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${evalData.experience_match_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Strengths & Gaps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" /> Key Candidate Strengths
                            </h4>
                            <ul className="space-y-2">
                              {evalData.strengths.map((str, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4" /> Identified Competency Gaps
                            </h4>
                            <ul className="space-y-2">
                              {evalData.identified_gaps.map((gap, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                                  <span>{gap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Skills & Resume */}
                    {activeTab === 'skills' && resumeData && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-300">Extracted Technical Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {resumeData.extracted_skills.map((skill, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {resumeData.executive_summary && (
                          <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                            <h4 className="text-xs font-bold text-slate-300">Executive Summary</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {resumeData.executive_summary}
                            </p>
                          </div>
                        )}

                        {resumeData.project_highlights && resumeData.project_highlights.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-300">Project Highlights</h4>
                            <div className="space-y-2">
                              {resumeData.project_highlights.map((proj, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                                  {proj}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Generated Questions */}
                    {activeTab === 'questions' && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400">
                          Tailored interview questions generated based on this candidate's resume gaps and the job requirements:
                        </p>
                        {questionsData.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                            No tailored questions generated.
                          </div>
                        ) : (
                          questionsData.map((q, i) => (
                            <div key={i} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {q.category} • {q.difficulty}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">Question {i + 1}</span>
                              </div>
                              <h4 className="text-sm font-bold text-white">{q.question}</h4>
                              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                                <span className="text-[11px] font-semibold text-slate-400 block">Expected Rubric / Evaluation Criteria:</span>
                                <p className="text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-900 leading-relaxed font-mono text-[11px]">
                                  {q.expected_answer_rubric}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })()
            )}
          </div>
        </div>
      )}
    </div>
  )
}
