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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Interviewer Desk
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome, <span className="text-slate-900 font-medium">{profile?.fullName || 'Interviewer'}</span> • Assigned Company: {profile?.companyName || 'HireWise Platform'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Upcoming Interviews</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : upcomingInterviews.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Feedback</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> : pendingFeedback.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Completed Reviews</p>
            <h3 className="text-2xl font-bold text-blue-700 mt-1">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : completedReviews.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Assigned Interviews List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-600" /> Upcoming Scheduled Technical Rounds
          </h3>
          <Link
            to="/interviewer/interviews"
            className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
          </div>
        ) : upcomingInterviews.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-slate-500">No upcoming interviews scheduled right now.</p>
            <p className="text-xs text-slate-400">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{item.candidateName}</span>
                      <span className="text-xs text-slate-500">({item.jobTitle})</span>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />{' '}
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
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm flex items-center gap-1.5"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Meet
                      </a>
                    )}
                    <Link
                      to={`/interviewer/interviews/${item.id}`}
                      className="rounded-lg bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FileQuestion className="h-3.5 w-3.5 text-indigo-600" /> Assessment Rubric
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
