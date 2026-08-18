import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { interviewsApi } from '@/lib/api/interviews-api'
import {
  Calendar,
  Clock,
  Video,
  User,
  Building,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import type { InterviewStatus } from '@/types/interviews'

const getStatusBadge = (status: InterviewStatus) => {
  switch (status) {
    case 'SCHEDULED':
      return { label: 'Scheduled & Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    case 'COMPLETED':
      return { label: 'Interview Completed', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    default:
      return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
  }
}

export function CandidateInterviewDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: interview, isLoading, error } = useQuery({
    queryKey: ['interviewDetail', id],
    queryFn: () => interviewsApi.getInterviewById(id!),
    enabled: !!id
  })

  if (isLoading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading interview details...</p>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Interview Not Found</h3>
        <p className="text-sm text-slate-400">Could not retrieve the interview record.</p>
        <Link
          to="/candidate/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 border border-slate-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </Link>
      </div>
    )
  }

  const badge = getStatusBadge(interview.status)
  const startDate = new Date(interview.scheduledStartTime)
  const endDate = new Date(interview.scheduledEndTime)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        to="/candidate/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Interviews
      </Link>

      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {interview.jobTitle}
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" /> {interview.companyName}
            </p>
          </div>

          {interview.meetingLink && interview.status === 'SCHEDULED' && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition shadow-lg shadow-emerald-950"
            >
              <Video className="h-4 w-4" /> Join Video Meeting
            </a>
          )}
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timing & Logistics */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" /> Date & Time
          </h3>

          <div className="space-y-3 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Date</p>
                <p className="font-semibold text-white">
                  {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Time Window</p>
                <p className="font-semibold text-white">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (UTC)
                </p>
              </div>
            </div>

            {interview.meetingLink && (
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-400 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-400">Meeting Room</p>
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-400 hover:underline truncate block"
                  >
                    {interview.meetingLink}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Interviewer */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="h-4 w-4 text-blue-400" /> Assigned Interviewer
          </h3>

          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                {interview.interviewerName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{interview.interviewerName}</p>
                <p className="text-xs text-slate-400">Technical Interviewer</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              Email: <span className="text-slate-300">{interview.interviewerEmail}</span>
            </p>
          </div>

          {interview.notes && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
              <p className="text-xs font-semibold text-slate-300">Notes from Recruiter</p>
              <p className="text-xs text-slate-400 whitespace-pre-wrap">{interview.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Preparation Guide Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-purple-400" /> Tips for Your Technical Interview
        </h3>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
          <li>Ensure your microphone, camera, and internet connection are tested before the session.</li>
          <li>Have a code editor or IDE ready if live coding or architecture walkthrough is required.</li>
          <li>Be prepared to explain your past projects and problem-solving decisions in detail.</li>
        </ul>
      </div>
    </div>
  )
}
