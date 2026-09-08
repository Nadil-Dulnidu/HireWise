import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api/jobs-api'
import type { EmploymentType, ExperienceLevel } from '@/types/jobs'
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Building,
  Clock,
  Filter,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export function PublicJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [activeSearch, setActiveSearch] = useState(initialSearch)
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['publicJobs', activeSearch, selectedType, selectedLevel, page],
    queryFn: () =>
      jobsApi.getPublicJobs({
        search: activeSearch || undefined,
        employmentType: selectedType !== 'ALL' ? (selectedType as EmploymentType) : undefined,
        experienceLevel: selectedLevel !== 'ALL' ? (selectedLevel as ExperienceLevel) : undefined,
        page,
        pageSize
      }),
    staleTime: 30000
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchTerm)
    setPage(1)
    if (searchTerm) {
      setSearchParams({ search: searchTerm })
    } else {
      setSearchParams({})
    }
  }

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Briefcase className="h-3.5 w-3.5" /> Technical Careers
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Explore Technical Openings
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Discover verified engineering roles evaluated with intelligent AI matching, structured interview rubrics, and automated calendar scheduling.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full flex items-center pl-3 bg-slate-50 rounded-xl border border-slate-200">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by role title, technology, or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Employment Type */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value)
                setPage(1)
              }}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Employment Types</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          {/* Experience Level */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value)
                setPage(1)
              }}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Experience Levels</option>
              <option value="ENTRY">Entry Level</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior Level</option>
              <option value="LEAD">Lead / Principal</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading technical job opportunities...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto" />
          <h3 className="text-sm font-semibold text-rose-900">Failed to load jobs</h3>
          <p className="text-xs text-rose-700">{(error as Error)?.message || 'An error occurred while fetching job postings.'}</p>
        </div>
      )}

      {/* Job Cards */}
      {!isLoading && !isError && (
        <>
          {data?.items && data.items.length > 0 ? (
            <div className="space-y-4">
              {data.items.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs hover:shadow-md"
                >
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-lg font-bold text-slate-900 hover:text-blue-600 transition"
                        >
                          {job.title}
                        </Link>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                          {job.experienceLevel}
                        </span>
                        <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                          {job.employmentType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Building className="h-3.5 w-3.5 text-slate-400" /> {job.companyName}
                        </span>
                        {job.departmentName && (
                          <span className="text-slate-500">
                            • {job.departmentName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <DollarSign className="h-3.5 w-3.5" /> {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3.5 w-3.5" /> Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
                    >
                      Apply Now <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Pagination controls */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing page {data.page} of {data.totalPages} ({data.totalCount} total openings)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!data.hasPreviousPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      disabled={!data.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
              <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No technical openings found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active job postings matched your current search filters. Try adjusting your search query or filters.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
