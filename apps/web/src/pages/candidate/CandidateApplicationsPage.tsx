import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications-api'
import { Link } from 'react-router-dom'
import {
  FileCheck,
  Search,
  Building,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Loader2,
  ChevronRight
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/applications'

const getStatusDetails = (status: ApplicationStatus) => {
  switch (status) {
    case 'APPLIED':
      return { label: 'Applied', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', step: 1 }
    case 'AI_REVIEW':
      return { label: 'AI Review in Progress', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', step: 2 }
    case 'AI_RECOMMENDED':
      return { label: 'AI Evaluated', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', step: 3 }
    case 'RECRUITER_REVIEW':
      return { label: 'Recruiter Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', step: 4 }
    case 'INTERVIEW_APPROVED':
      return { label: 'Interview Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', step: 5 }
    case 'INTERVIEW_SCHEDULED':
      return { label: 'Interview Scheduled', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', step: 6 }
    case 'INTERVIEW_COMPLETED':
      return { label: 'Interview Completed', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', step: 7 }
    case 'EVALUATION_PENDING':
      return { label: 'Final Decision Pending', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', step: 8 }
    case 'SELECTED':
      return { label: 'Offer / Selected', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', step: 9 }
    case 'REJECTED':
      return { label: 'Not Selected', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', step: 0 }
    default:
      return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', step: 1 }
  }
}

export function CandidateApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['myApplications', page, searchTerm],
    queryFn: () => applicationsApi.getMyApplications({ page, pageSize: 10, search: searchTerm || undefined })
  })

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Application Journey
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          My Submitted Applications
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your application lifecycle stages in real-time as our AI agents and recruiters evaluate your profile.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 pl-1" />
        <input
          type="text"
          placeholder="Filter by job title or company name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        ) : data && data.items.length > 0 ? (
          data.items.map((app) => {
            const statusInfo = getStatusDetails(app.status)

            return (
              <div
                key={app.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-white hover:text-blue-400 transition">
                        {app.jobTitle}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <Building className="h-3.5 w-3.5 text-slate-500" /> {app.companyName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" /> {app.jobLocation}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3.5 w-3.5" /> Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/candidate/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition shrink-0 self-start sm:self-center"
                  >
                    View Status Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Micro Pipeline Step Tracker */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                    <span className="text-slate-300">Application Pipeline:</span>
                    <span>{statusInfo.label}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        app.status === 'REJECTED'
                          ? 'bg-red-500 w-full'
                          : app.status === 'SELECTED'
                          ? 'bg-emerald-500 w-full'
                          : 'bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500'
                      }`}
                      style={{
                        width: app.status === 'REJECTED' || app.status === 'SELECTED' ? '100%' : `${(statusInfo.step / 8) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center space-y-3">
            <FileCheck className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No applications found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't submitted any applications yet. Explore our open positions and apply with your active resume.
            </p>
            <div className="pt-2">
              <Link
                to="/candidate/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white transition shadow-md shadow-blue-600/20"
              >
                Browse Open Roles <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
