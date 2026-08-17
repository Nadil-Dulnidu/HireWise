import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications-api'
import {
  FileText,
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Bot
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/applications'

const allStatuses: { value: ApplicationStatus; label: string }[] = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'AI_REVIEW', label: 'AI Review in Progress' },
  { value: 'AI_RECOMMENDED', label: 'AI Recommended' },
  { value: 'RECRUITER_REVIEW', label: 'Recruiter Review' },
  { value: 'INTERVIEW_APPROVED', label: 'Interview Approved' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed' },
  { value: 'EVALUATION_PENDING', label: 'Evaluation Pending' },
  { value: 'SELECTED', label: 'Selected / Offer' },
  { value: 'REJECTED', label: 'Rejected' }
]

export function RecruiterApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | ''>('')
  const [statusNotes, setStatusNotes] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ['recruiterApplicationDetail', id],
    queryFn: () => applicationsApi.getApplicationById(id!),
    enabled: !!id
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      applicationsApi.updateApplicationStatus(id!, { status, notes: statusNotes || undefined }),
    onSuccess: (data) => {
      setActionError(null)
      setActionSuccess(`Application status updated to ${data?.status?.replace(/_/g, ' ') || 'updated status'}`)
      queryClient.invalidateQueries({ queryKey: ['recruiterApplicationDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['companyApplications'] })
      setTimeout(() => setActionSuccess(null), 4000)
    },
    onError: (err: any) => {
      setActionSuccess(null)
      setActionError(err?.response?.data?.error || err.message || 'Failed to update status')
    }
  })

  const approveMutation = useMutation({
    mutationFn: () => applicationsApi.approveForInterview(id!),
    onSuccess: () => {
      setActionError(null)
      setActionSuccess('Candidate approved for technical interview scheduling!')
      queryClient.invalidateQueries({ queryKey: ['recruiterApplicationDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['companyApplications'] })
      setTimeout(() => setActionSuccess(null), 4000)
    }
  })

  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.rejectApplication(id!),
    onSuccess: () => {
      setActionError(null)
      setActionSuccess('Application marked as rejected.')
      queryClient.invalidateQueries({ queryKey: ['recruiterApplicationDetail', id] })
      queryClient.invalidateQueries({ queryKey: ['companyApplications'] })
      setTimeout(() => setActionSuccess(null), 4000)
    }
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (isError || !application) {
    return (
      <div className="glass-card max-w-md mx-auto p-8 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Application Not Found</h2>
        <p className="text-xs text-slate-400">The application may have been removed or you lack authorization.</p>
        <Link
          to="/recruiter/applications"
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Candidate Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back button */}
      <Link
        to="/recruiter/applications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Candidate Pipeline
      </Link>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Candidate Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/30 text-xl font-bold">
              {application.candidateName[0]}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {application.candidateName}
                </h1>
                <span className="rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-0.5 text-xs font-bold">
                  {application.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Candidate for <span className="text-white font-bold">{application.jobTitle}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500" /> {application.candidateEmail}
                </span>
                {application.candidatePhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-500" /> {application.candidatePhone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Applied {new Date(application.appliedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            {application.resumeSnapshotUrl && (
              <a
                href={application.resumeSnapshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-blue-600/20"
              >
                <Download className="h-4 w-4" /> Download Resume
              </a>
            )}
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || application.status === 'INTERVIEW_APPROVED'}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 px-4 py-2.5 text-xs font-semibold transition"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve for Interview
            </button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || application.status === 'REJECTED'}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2.5 text-xs font-semibold transition"
            >
              <XCircle className="h-4 w-4" /> Reject Application
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cover Letter & AI Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover letter */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" /> Candidate Cover Letter & Notes
            </h2>
            {application.coverLetter ? (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 whitespace-pre-line">
                {application.coverLetter}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">No cover letter was submitted with this application.</p>
            )}
          </div>

          {/* AI Workflow Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="h-4 w-4 text-pink-400" /> AI Evaluation Intelligence
              </h2>
              <span className="rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                LangGraph Multi-Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluated against rubric skills, experience requirements, and technical constraints.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-300 font-semibold block">Multi-Agent Assessment</span>
                <span className="text-[11px] text-slate-500">Autonomous Rubric Matching & Gap Analysis</span>
              </div>
              <Link
                to="/recruiter/ai-evaluations"
                className="rounded-lg bg-pink-600/20 border border-pink-500/30 text-pink-300 hover:bg-pink-600/30 px-3 py-1.5 text-xs font-semibold transition"
              >
                Inspect AI Rubric →
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Status Transition Control */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white">Manual Status Progression</h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">New Status</label>
                <select
                  value={selectedStatus || application.status}
                  onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {allStatuses.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-900 text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Status Change Note (Optional)</label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason for status change..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => {
                  if (selectedStatus && selectedStatus !== application.status) {
                    updateStatusMutation.mutate(selectedStatus as ApplicationStatus)
                  }
                }}
                disabled={updateStatusMutation.isPending || !selectedStatus || selectedStatus === application.status}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-purple-600/20 cursor-pointer"
              >
                {updateStatusMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update Candidate Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
