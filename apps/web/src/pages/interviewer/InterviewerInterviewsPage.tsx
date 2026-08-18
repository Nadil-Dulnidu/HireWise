import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interviewsApi } from '@/lib/api/interviews-api'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Clock,
  Video,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileQuestion,
  Search,
  Filter
} from 'lucide-react'
import type { InterviewStatus } from '@/types/interviews'

const getStatusBadge = (status: InterviewStatus) => {
  switch (status) {
    case 'SCHEDULED':
      return { label: 'Scheduled', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    case 'COMPLETED':
      return { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    default:
      return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
  }
}

export function InterviewerInterviewsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['interviewerInterviews', page, statusFilter, searchTerm],
    queryFn: () =>
      interviewsApi.getInterviews({
        page,
        pageSize: 15,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as InterviewStatus),
        search: searchTerm || undefined
      })
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => interviewsApi.completeInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewerInterviews'] })
    }
  })

  const interviews = data?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-emerald-400" /> Assigned Technical Interviews
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conduct candidate assessments, review AI question prompts, and submit structured feedback.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Interviews List */}
      {isLoading ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading assigned interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <CalendarCheck className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No interviews found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You do not have any interviews matching the selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const badge = getStatusBadge(interview.status)
            const startDate = new Date(interview.scheduledStartTime)

            return (
              <div
                key={interview.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white">{interview.candidateName}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Position: <span className="text-slate-200 font-medium">{interview.jobTitle}</span> • Candidate: {interview.candidateEmail}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {interview.meetingLink && interview.status === 'SCHEDULED' && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Meet
                      </a>
                    )}

                    {interview.status === 'SCHEDULED' && (
                      <button
                        onClick={() => completeMutation.mutate(interview.id)}
                        disabled={completeMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                      </button>
                    )}

                    <Link
                      to={`/interviewer/interviews/${interview.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                    >
                      {interview.hasFeedback ? 'View Evaluation' : 'Evaluate & Feedback'} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>
                      {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-purple-400" />
                    <span>Evaluation: {interview.hasFeedback ? <strong className="text-emerald-400">Submitted ({interview.overallRating}/5)</strong> : <strong className="text-amber-400">Pending Feedback</strong>}</span>
                  </div>

                  {interview.recommendation && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-400" />
                      <span>Recommendation: <strong className="text-white">{interview.recommendation.replace('_', ' ')}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
