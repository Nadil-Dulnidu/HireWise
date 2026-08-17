import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { applicationsApi } from '@/lib/api/applications-api'
import {
  FileText,
  Building,
  MapPin,
  Clock,
  ArrowLeft,
  Download,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/applications'

const pipelineSteps: { key: ApplicationStatus; title: string; desc: string }[] = [
  { key: 'APPLIED', title: '1. Application Submitted', desc: 'Received in system and queued for parsing.' },
  { key: 'AI_REVIEW', title: '2. AI Resume & Job Analysis', desc: 'Deterministic skill extraction and scoring.' },
  { key: 'AI_RECOMMENDED', title: '3. Evaluation Recommendation', desc: 'Fit rubric and candidate profile ranked.' },
  { key: 'RECRUITER_REVIEW', title: '4. Recruiter Review', desc: 'Hiring team reviewing AI recommendation.' },
  { key: 'INTERVIEW_APPROVED', title: '5. Interview Approved', desc: 'Approved to schedule technical interview round.' },
  { key: 'INTERVIEW_SCHEDULED', title: '6. Interview Scheduled', desc: 'Meeting time booked with technical interviewer.' },
  { key: 'INTERVIEW_COMPLETED', title: '7. Interview Completed', desc: 'Technical evaluation round concluded.' },
  { key: 'SELECTED', title: '8. Final Decision', desc: 'Hiring decision finalized.' }
]

export function CandidateApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ['applicationDetail', id],
    queryFn: () => applicationsApi.getApplicationById(id!),
    enabled: !!id
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (isError || !application) {
    return (
      <div className="glass-card max-w-md mx-auto p-8 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Application Not Found</h2>
        <p className="text-xs text-slate-400">The requested application could not be loaded.</p>
        <Link
          to="/candidate/applications"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back link */}
      <Link
        to="/candidate/applications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Applications
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {application.jobTitle}
              </h1>
              <span className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-xs font-bold">
                Status: {application.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Building className="h-3.5 w-3.5 text-slate-500" /> {application.companyName}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" /> {application.jobLocation}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" /> Applied on {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {application.resumeSnapshotUrl && (
            <a
              href={application.resumeSnapshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition shrink-0"
            >
              <Download className="h-4 w-4 text-blue-400" /> Attached Resume
            </a>
          )}
        </div>
      </div>

      {/* Two Column Layout: Timeline & Submitted Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Progress Timeline */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" /> Application Journey Stages
          </h2>

          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {pipelineSteps.map((step, idx) => {
              const isCurrent = application.status === step.key

              return (
                <div key={idx} className="relative flex items-start gap-4 pl-1">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold z-10 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                        : 'bg-slate-900 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-semibold ${isCurrent ? 'text-blue-400' : 'text-white'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Submitted Details & Notes */}
        <div className="space-y-6">
          {/* Cover Letter */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" /> Submitted Cover Letter
            </h3>
            {application.coverLetter ? (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 whitespace-pre-line">
                {application.coverLetter}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">No cover letter was attached.</p>
            )}
          </div>

          {/* Job Overview Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Position Requirements</h3>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-6">
              {application.jobRequirements}
            </p>
            <Link
              to={`/jobs/${application.jobId}`}
              className="inline-block text-xs font-semibold text-blue-400 hover:underline pt-2"
            >
              View Full Job Description →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
