import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { interviewsApi } from '@/lib/api/interviews-api'
import { Link } from 'react-router-dom'
import {
  History,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  Loader2,
  Search
} from 'lucide-react'

export function InterviewerHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['interviewerHistory', page, searchTerm],
    queryFn: () =>
      interviewsApi.getInterviews({
        page,
        pageSize: 15,
        status: 'COMPLETED',
        search: searchTerm || undefined
      })
  })

  const interviews = data?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <History className="h-7 w-7 text-blue-400" /> Evaluation History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your completed technical interview rubrics and candidate recommendation records.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading evaluation history...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No completed evaluations found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Interviews you conduct and submit feedback for will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => {
            const date = new Date(item.scheduledStartTime)

            return (
              <div
                key={item.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white">{item.candidateName}</h3>
                      {item.recommendation && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {item.recommendation.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Position: <span className="text-slate-200">{item.jobTitle}</span> • {item.companyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.overallRating && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-bold text-emerald-400">
                        <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                        <span>{item.overallRating} / 5.0</span>
                      </div>
                    )}
                    <Link
                      to={`/interviewer/interviews/${item.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
                    >
                      View Rubric <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Conducted on {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
