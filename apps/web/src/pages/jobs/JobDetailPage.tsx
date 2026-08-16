import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api/jobs-api'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  Users,
  CheckCircle2,
  Share2,
  Loader2,
  AlertCircle
} from 'lucide-react'

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isSignedIn } = useCurrentUser()

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ['jobDetail', id],
    queryFn: () => jobsApi.getJobById(id!),
    enabled: !!id
  })

  const formatSalary = (min?: number | null, max?: number | null, currency = 'USD') => {
    if (!min && !max) return 'Competitive salary'
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    })
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`
    if (min) return `From ${formatter.format(min)}`
    return `Up to ${formatter.format(max!)}`
  }

  const handleApplyClick = () => {
    if (!isSignedIn) {
      navigate(`/sign-up?redirect_url=/candidate/jobs/${id}`)
    } else {
      navigate(`/candidate/jobs/${id}/apply`)
    }
  }

  if (isLoading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading job specifications...</p>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Job opening not found</h2>
        <p className="text-sm text-slate-400">
          {(error as Error)?.message || 'This job posting may have been closed or removed by the hiring team.'}
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-semibold text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to open roles
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to open positions
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[90px] pointer-events-none -z-10 rounded-full"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                {job.experienceLevel} Level
              </span>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
                {job.employmentType.replace('_', ' ')}
              </span>
              {job.status !== 'OPEN' && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  Status: {job.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Building className="h-4 w-4 text-slate-500" /> {job.companyName}
              </span>
              {job.departmentName && (
                <span className="text-slate-400">
                  • {job.departmentName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-500" /> {job.location}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <DollarSign className="h-4 w-4" /> {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={handleApplyClick}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/30"
            >
              <Sparkles className="h-4 w-4" /> Apply with AI Match
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('Job link copied to clipboard!')
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Share Position
            </button>
          </div>
        </div>

        {/* Meta Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block">Total Applicants</span>
            <span className="text-slate-200 font-bold mt-0.5 block flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-400" /> {job.applicationCount} Applied
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block">Posted Date</span>
            <span className="text-slate-200 font-bold mt-0.5 block flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-purple-400" /> {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block">Application Deadline</span>
            <span className="text-slate-200 font-bold mt-0.5 block flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Rolling basis'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block">Recruitment Mode</span>
            <span className="text-slate-200 font-bold mt-0.5 block flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" /> AI Evaluated
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Job Description & Requirements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" /> Role Overview
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Key Requirements & Qualifications
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </div>
          </div>
        </div>

        {/* Right: Company Overview Card */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 sticky top-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{job.companyName}</h3>
                <p className="text-xs text-slate-400">{job.companyLocation || job.location}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-300 border-t border-slate-800">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Department</span>
                <span className="font-medium text-white">{job.departmentName || 'General Engineering'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Role Type</span>
                <span className="font-medium text-white">{job.employmentType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Experience</span>
                <span className="font-medium text-white">{job.experienceLevel} Level</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Compensation</span>
                <span className="font-medium text-emerald-400">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
              </div>
            </div>

            <button
              onClick={handleApplyClick}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-xs font-semibold text-white transition shadow-md shadow-blue-600/25 mt-4"
            >
              <Sparkles className="h-4 w-4" /> Apply for this Position
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
