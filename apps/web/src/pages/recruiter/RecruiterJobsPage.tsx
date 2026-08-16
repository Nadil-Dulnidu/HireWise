import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api/jobs-api'
import type { JobStatus } from '@/types/jobs'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Users,
  PlayCircle,
  PauseCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'

export function RecruiterJobsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['recruiterJobs', statusFilter, searchTerm],
    queryFn: () =>
      jobsApi.getRecruiterJobs({
        status: statusFilter !== 'ALL' ? (statusFilter as JobStatus) : undefined,
        search: searchTerm || undefined,
        pageSize: 50
      })
  })

  // Mutation to update job status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobsApi.updateJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update job status')
    }
  })

  // Mutation to delete job
  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete job')
    }
  })

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Open
          </span>
        )
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-500/20">
            Draft
          </span>
        )
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            Paused
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            Closed
          </span>
        )
    }
  }

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the job "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Job Openings Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, publish, and track company job listings and active applicant pipelines.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition shadow-lg shadow-purple-600/25 shrink-0"
        >
          <Plus className="h-4 w-4" /> Post New Job
        </Link>
      </div>

      {/* Filters bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full flex items-center pl-3 bg-slate-950/50 rounded-xl border border-slate-800">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search job titles or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="DRAFT">Draft Only</option>
            <option value="PAUSED">Paused Only</option>
            <option value="CLOSED">Closed Only</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading company jobs...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-red-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Failed to load job listings</h3>
          <p className="text-xs text-slate-400">{(error as Error)?.message}</p>
        </div>
      )}

      {/* Jobs Table */}
      {!isLoading && !isError && (
        <>
          {data?.items && data.items.length > 0 ? (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Job Title & Level</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Applicants</th>
                      <th className="px-6 py-4">Posted Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.items.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-900/40 transition">
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="font-bold text-white hover:text-purple-400 transition"
                            >
                              {job.title}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{job.employmentType.replace('_', ' ')}</span>
                              <span>•</span>
                              <span className="text-purple-400 font-medium">{job.experienceLevel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 text-xs font-medium">
                          {job.departmentName || 'General'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/recruiter/applications?jobId=${job.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20"
                          >
                            <Users className="h-3.5 w-3.5" />
                            {job.applicationCount} candidates
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick status transitions */}
                            {job.status === 'DRAFT' && (
                              <button
                                title="Publish as Open"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'OPEN' })}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </button>
                            )}
                            {job.status === 'OPEN' && (
                              <button
                                title="Pause Job"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'PAUSED' })}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                              >
                                <PauseCircle className="h-4 w-4" />
                              </button>
                            )}
                            {job.status === 'PAUSED' && (
                              <button
                                title="Resume Job (Open)"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'OPEN' })}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </button>
                            )}
                            {job.status !== 'CLOSED' && (
                              <button
                                title="Close Job"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'CLOSED' })}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}

                            <Link
                              to={`/recruiter/jobs/${job.id}/edit`}
                              title="Edit Job"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => handleDelete(job.id, job.title)}
                              title="Delete Job"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-4">
              <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No jobs found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {statusFilter !== 'ALL'
                    ? `No jobs found with status "${statusFilter}". Try changing the filter.`
                    : "You haven't posted any job openings for your company yet."}
                </p>
              </div>
              <Link
                to="/recruiter/jobs/new"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-purple-600/25"
              >
                <Plus className="h-4 w-4" /> Post Your First Job
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
