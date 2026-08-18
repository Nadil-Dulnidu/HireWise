import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interviewsApi } from '@/lib/api/interviews-api'
import { applicationsApi } from '@/lib/api/applications-api'
import {
  ArrowLeft,
  Clock,
  Video,
  User,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Award,
  ChevronRight
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

export function RecruiterInterviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: interview, isLoading, error } = useQuery({
    queryKey: ['interviewDetail', id],
    queryFn: () => interviewsApi.getInterviewById(id!),
    enabled: !!id
  })

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: 'SELECTED' | 'REJECTED') =>
      applicationsApi.updateApplicationStatus(interview!.applicationId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewDetail', id] })
    }
  })

  if (isLoading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading interview details...</p>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Interview Not Found</h3>
        <Link
          to="/recruiter/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </Link>
      </div>
    )
  }

  const badge = getStatusBadge(interview.status)
  const feedback = interview.feedback
  const startDate = new Date(interview.scheduledStartTime)
  const endDate = new Date(interview.scheduledEndTime)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        to="/recruiter/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to All Interviews
      </Link>

      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {interview.candidateName}
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Role: <span className="text-white font-medium">{interview.jobTitle}</span> • {interview.companyName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {interview.meetingLink && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
              >
                <Video className="h-4 w-4 text-emerald-400" /> Join Meet
              </a>
            )}
            <Link
              to={`/recruiter/applications/${interview.applicationId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition"
            >
              <FileText className="h-4 w-4" /> View Full Application <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2-Column: Details & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Logistics & Participants */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timing */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" /> Schedule Information
            </h3>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Date</span>
              <p className="font-semibold text-white">
                {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Time</span>
              <p className="font-semibold text-white">
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (UTC)
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" /> Participants
            </h3>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Candidate</span>
              <p className="font-semibold text-white">{interview.candidateName}</p>
              <p className="text-slate-400">{interview.candidateEmail}</p>
              {interview.candidatePhone && <p className="text-slate-400">{interview.candidatePhone}</p>}
            </div>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Assigned Evaluator</span>
              <p className="font-semibold text-white">{interview.interviewerName}</p>
              <p className="text-slate-400">{interview.interviewerEmail}</p>
            </div>
          </div>

          {/* Hiring Decision Actions */}
          {feedback && (
            <div className="glass-card p-6 rounded-2xl border border-purple-500/30 space-y-3 bg-purple-950/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-400" /> Take Final Hiring Action
              </h3>
              <p className="text-xs text-slate-400">
                Review completed evaluator rubric and choose whether to issue an offer or reject candidate.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => updateStatusMutation.mutate('SELECTED')}
                  disabled={updateStatusMutation.isPending}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Make Offer
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate('REJECTED')}
                  disabled={updateStatusMutation.isPending}
                  className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Evaluator Feedback */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" /> Interviewer Assessment & Feedback
            </h3>

            {feedback ? (
              <div className="space-y-5">
                {/* Score Banner */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Overall Score</p>
                    <h4 className="text-3xl font-black text-emerald-400 mt-0.5">
                      {feedback.overallRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Evaluator Verdict</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {feedback.recommendation.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Technical</span>
                    <strong className="text-white text-sm">{feedback.technicalSkillsRating}/5</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Problem Solving</span>
                    <strong className="text-white text-sm">{feedback.problemSolvingRating}/5</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Communication</span>
                    <strong className="text-white text-sm">{feedback.communicationRating}/5</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                    <span className="text-slate-400 block text-[10px]">Cultural Fit</span>
                    <strong className="text-white text-sm">{feedback.culturalFitRating}/5</strong>
                  </div>
                </div>

                {feedback.strengths && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-emerald-400">Observed Strengths</p>
                    <p className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-300 whitespace-pre-wrap">
                      {feedback.strengths}
                    </p>
                  </div>
                )}

                {feedback.weaknesses && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-amber-400">Identified Gaps</p>
                    <p className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-300 whitespace-pre-wrap">
                      {feedback.weaknesses}
                    </p>
                  </div>
                )}

                {feedback.notes && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-400">Evaluator Synthesis</p>
                    <p className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-300 whitespace-pre-wrap">
                      {feedback.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <Clock className="h-8 w-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Evaluation Pending</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {interview.interviewerName} has not yet submitted feedback for this interview. Once completed, scores and rubrics will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
