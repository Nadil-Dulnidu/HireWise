import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { interviewsApi } from '@/lib/api/interviews-api'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Video,
  User,
  ArrowRight,
  Loader2,
  CalendarCheck
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
    case 'NO_SHOW':
      return { label: 'No Show', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
    default:
      return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
  }
}

export function CandidateInterviewsPage() {
  const [page] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['myInterviews', page],
    queryFn: () => interviewsApi.getMyInterviews({ page, pageSize: 10 })
  })

  const interviews = data?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-emerald-400" /> My Interviews
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your scheduled interview sessions and prepare for technical rounds.
          </p>
        </div>
        <Link
          to="/candidate/availability"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 border border-slate-700 transition"
        >
          <Clock className="h-4 w-4 text-emerald-400" /> Manage My Availability
        </Link>
      </div>

      {/* Interviews List */}
      {isLoading ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No interviews scheduled yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            When recruiters review and approve your applications, you will receive interview invites here.
          </p>
          <Link
            to="/candidate/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition"
          >
            Check Application Status <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const badge = getStatusBadge(interview.status)
            const startDate = new Date(interview.scheduledStartTime)
            const endDate = new Date(interview.scheduledEndTime)

            return (
              <div
                key={interview.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white">{interview.jobTitle}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{interview.companyName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {interview.meetingLink && interview.status === 'SCHEDULED' && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-sm"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Meeting
                      </a>
                    )}
                    <Link
                      to={`/candidate/interviews/${interview.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                    >
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>{startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span>
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <span>Interviewer: <strong className="text-slate-300">{interview.interviewerName}</strong></span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
