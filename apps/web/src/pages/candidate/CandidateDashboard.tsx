import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications-api'
import { interviewsApi } from '@/lib/api/interviews-api'
import { resumesApi } from '@/lib/api/resumes-api'
import {
  Briefcase,
  FileCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react'

export function CandidateDashboard() {
  const { profile } = useCurrentUser()

  const { data: appsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ['candidate-dashboard-applications'],
    queryFn: () => applicationsApi.getMyApplications({ pageSize: 50 })
  })

  const { data: interviewsData, isLoading: isInterviewsLoading } = useQuery({
    queryKey: ['candidate-dashboard-interviews'],
    queryFn: () => interviewsApi.getInterviews({ page: 1, pageSize: 50 })
  })

  const { data: resumeData } = useQuery({
    queryKey: ['candidate-dashboard-resume'],
    queryFn: () => resumesApi.getMyActiveResume()
  })

  const allApplications = appsData?.items || []
  const activeApplicationsCount = allApplications.filter(
    (a) => a.status !== 'REJECTED' && a.status !== 'SELECTED'
  ).length
  const aiReviewsCount = allApplications.filter(
    (a) => a.status === 'AI_REVIEW' || a.status === 'APPLIED'
  ).length

  const allInterviews = interviewsData?.items || []
  const scheduledInterviewsCount = allInterviews.filter(
    (i) => i.status === 'SCHEDULED'
  ).length

  // Calculate real profile completeness
  let completenessScore = 0
  if (profile?.firstName && profile?.lastName) completenessScore += 25
  if (profile?.email) completenessScore += 25
  if (profile?.phone) completenessScore += 25
  if (resumeData?.fileUrl) completenessScore += 25

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" /> Candidate Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome, {profile?.firstName || 'Candidate'}!
          </h1>
          <p className="text-sm text-slate-400">
            Track your job applications, view AI evaluation feedback, and manage your upcoming interview schedules.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/candidate/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-md shadow-blue-600/20"
            >
              Browse Open Roles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/candidate/resume"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Manage Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Applications',
            value: isAppsLoading ? '...' : activeApplicationsCount.toString(),
            icon: FileCheck,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
          },
          {
            label: 'AI Reviews In Progress',
            value: isAppsLoading ? '...' : aiReviewsCount.toString(),
            icon: Sparkles,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
          },
          {
            label: 'Interviews Scheduled',
            value: isInterviewsLoading ? '...' : scheduledInterviewsCount.toString(),
            icon: Calendar,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
          },
          {
            label: 'Profile Completeness',
            value: `${completenessScore}%`,
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
          },
        ].map((metric, i) => (
          <div key={i} className="glass-card p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">{metric.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{metric.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${metric.bg} ${metric.color}`}>
              <metric.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Applications & Availability Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-400" /> Recent Applications
            </h3>
            <Link to="/candidate/applications" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          {isAppsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin mx-auto" />
            </div>
          ) : allApplications.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-8 text-center space-y-3">
              <Briefcase className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">You haven't submitted any job applications yet.</p>
              <Link
                to="/candidate/jobs"
                className="inline-block text-xs font-semibold text-blue-400 hover:underline"
              >
                Explore available tech openings →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {allApplications.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{app.jobTitle}</span>
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/candidate/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition"
                  >
                    View Timeline <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" /> Availability Sync
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Set your weekly free hours to allow the AI Scheduling Agent to automatically coordinate interview slots with technical interviewers.
          </p>
          <Link
            to="/candidate/availability"
            className="w-full inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition"
          >
            Update Weekly Availability
          </Link>
        </div>
      </div>
    </div>
  )
}

