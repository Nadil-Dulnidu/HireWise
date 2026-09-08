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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Open
          </span>
        )
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
            Draft
          </span>
        )
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            Paused
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Job Openings Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create, publish, and track company job listings and active applicant pipelines.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Post New Job
        </Link>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full flex items-center pl-3 bg-slate-50 rounded-xl border border-slate-200">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search job titles or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none"
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
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading company jobs...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto" />
          <h3 className="text-sm font-semibold text-rose-900">Failed to load job listings</h3>
          <p className="text-xs text-rose-700">{(error as Error)?.message}</p>
        </div>
      )}

      {/* Jobs Table */}
      {!isLoading && !isError && (
        <>
          {data?.items && data.items.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Job Title & Level</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Applicants</th>
                      <th className="px-6 py-4">Posted Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition"
                            >
                              {job.title}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{job.employmentType.replace('_', ' ')}</span>
                              <span>•</span>
                              <span className="text-blue-600 font-semibold">{job.experienceLevel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                          {job.departmentName || 'General'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/recruiter/applications?jobId=${job.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                          >
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                            {job.applicationCount} candidates
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick status transitions */}
                            {job.status === 'DRAFT' && (
                              <button
                                title="Publish as Open"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'OPEN' })}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </button>
                            )}
                            {job.status === 'OPEN' && (
                              <button
                                title="Pause Job"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'PAUSED' })}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                              >
                                <PauseCircle className="h-4 w-4" />
                              </button>
                            )}
                            {job.status === 'PAUSED' && (
                              <button
                                title="Resume Job (Open)"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'OPEN' })}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                              >
                                <PlayCircle className="h-4 w-4" />
                              </button>
                            )}
                            {job.status !== 'CLOSED' && (
                              <button
                                title="Close Job"
                                onClick={() => statusMutation.mutate({ id: job.id, status: 'CLOSED' })}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}

                            <Link
                              to={`/recruiter/jobs/${job.id}/edit`}
                              title="Edit Job"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => handleDelete(job.id, job.title)}
                              title="Delete Job"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
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
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
              <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No jobs found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {statusFilter !== 'ALL'
                    ? `No jobs found with status "${statusFilter}". Try changing the filter.`
                    : "You haven't posted any job openings for your company yet."}
                </p>
              </div>
              <Link
                to="/recruiter/jobs/new"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm"
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
