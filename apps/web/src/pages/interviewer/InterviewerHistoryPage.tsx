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
        <div className="space-y-4">
          {interviews.map((item) => {
            const date = new Date(item.scheduledStartTime);

            return (
              <div
                key={item.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900">
                        {item.candidateName}
                      </h3>
                      {item.recommendation && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.recommendation.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Position:{" "}
                      <span className="text-slate-800 font-medium">
                        {item.jobTitle}
                      </span>{" "}
                      • {item.companyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.overallRating && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                        <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                        <span>{item.overallRating} / 5.0</span>
                      </div>
                    )}
                    <Link
                      to={`/interviewer/interviews/${item.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 border border-slate-200 transition"
                    >
                      View Rubric <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
