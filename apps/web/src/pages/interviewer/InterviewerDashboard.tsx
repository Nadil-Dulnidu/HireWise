import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQuery } from '@tanstack/react-query'
import { interviewsApi } from '@/lib/api/interviews-api'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  FileQuestion,
  Video,
  ArrowRight,
  Loader2
} from 'lucide-react'

export function InterviewerDashboard() {
  const { profile } = useCurrentUser()

  const { data, isLoading } = useQuery({
    queryKey: ['interviewerDashboardInterviews'],
    queryFn: () => interviewsApi.getInterviews({ page: 1, pageSize: 50 })
  })

  const allInterviews = data?.items || []
  const upcomingInterviews = allInterviews.filter((i) => i.status === 'SCHEDULED')
  const pendingFeedback = allInterviews.filter((i) => i.status === 'COMPLETED' && !i.hasFeedback)
  const completedReviews = allInterviews.filter((i) => i.hasFeedback)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Interviewer Desk
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Welcome, <span className="text-white font-medium">{profile?.fullName || 'Interviewer'}</span> • Assigned Company: {profile?.companyName || 'HireWise Platform'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Upcoming Interviews</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : upcomingInterviews.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Pending Feedback</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : pendingFeedback.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed Reviews</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : completedReviews.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Assigned Interviews List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-400" /> Upcoming Scheduled Technical Rounds
          </h3>
          <Link
            to="/interviewer/interviews"
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 text-emerald-400 animate-spin mx-auto" />
          </div>
        ) : upcomingInterviews.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-slate-400">No upcoming interviews scheduled right now.</p>
            <p className="text-xs text-slate-500">
              When recruiters assign you candidate rounds, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.slice(0, 5).map((item) => {
              const startDate = new Date(item.scheduledStartTime)
              const endDate = new Date(item.scheduledEndTime)

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{item.candidateName}</span>
                      <span className="text-xs text-slate-400">({item.jobTitle})</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />{' '}
                      {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.meetingLink && (
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm flex items-center gap-1.5"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Meet
                      </a>
                    )}
                    <Link
                      to={`/interviewer/interviews/${item.id}`}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
                    >
                      <FileQuestion className="h-3.5 w-3.5 text-purple-400" /> Assessment Rubric
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
