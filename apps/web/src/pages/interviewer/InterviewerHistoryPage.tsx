import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  Loader2,
  Search,
} from "lucide-react";

export function InterviewerHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["interviewerHistory", page, searchTerm],
    queryFn: () =>
      interviewsApi.getInterviews({
        page,
        pageSize: 15,
        status: "COMPLETED",
        search: searchTerm || undefined,
      }),
  });

  const interviews = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Evaluation History
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your completed technical interview rubrics and candidate
          recommendation records.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">
            Loading evaluation history...
          </p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No completed evaluations found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Interviews you conduct and submit feedback for will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((item) => {
            const date = new Date(item.scheduledStartTime);

            return (
              <div
                key={item.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {item.companyName}
                    </span>
                    {item.overallRating && (
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 shrink-0">
                        <Star className="h-3 w-3 fill-blue-600 text-blue-600" />
                        <span>{item.overallRating} / 5.0</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                      {item.candidateName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate pt-0.5">
                      Role: <strong className="text-slate-800 font-medium">{item.jobTitle}</strong>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {item.recommendation && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Verdict:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.recommendation.replace("_", " ")}
                        </span>
                      </div>
                    )}
                    <div className="text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Conducted on{" "}
                        {date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to={`/interviewer/interviews/${item.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition"
                  >
                    View Scoring Rubric <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
