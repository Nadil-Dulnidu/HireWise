import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  Video,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileQuestion,
  Search,
  Filter,
} from "lucide-react";
import type { InterviewStatus } from "@/types/interviews";

const getStatusBadge = (status: InterviewStatus) => {
  switch (status) {
    case "SCHEDULED":
      return {
        label: "Scheduled",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    default:
      return {
        label: status,
        color: "text-slate-600",
        bg: "bg-slate-100",
        border: "border-slate-200",
      };
  }
};

export function InterviewerInterviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["interviewerInterviews", page, statusFilter, searchTerm],
    queryFn: () =>
      interviewsApi.getInterviews({
        page,
        pageSize: 15,
        status:
          statusFilter === "ALL"
            ? undefined
            : (statusFilter as InterviewStatus),
        search: searchTerm || undefined,
      }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => interviewsApi.completeInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewerInterviews"] });
    },
  });

  const interviews = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-emerald-600" /> Assigned
            Technical Interviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct candidate assessments, review AI question prompts, and
            submit structured feedback.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Interviews List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500">
            Loading assigned interviews...
          </p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <CalendarCheck className="h-8 w-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No interviews found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any interviews matching the selected filter
            criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const badge = getStatusBadge(interview.status);
            const startDate = new Date(interview.scheduledStartTime);

            return (
              <div
                key={interview.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900">
                        {interview.candidateName}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Position:{" "}
                      <span className="text-slate-800 font-medium">
                        {interview.jobTitle}
                      </span>{" "}
                      • Candidate: {interview.candidateEmail}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {interview.meetingLink &&
                      interview.status === "SCHEDULED" && (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition shadow-sm"
                        >
                          <Video className="h-3.5 w-3.5" /> Join Meet
                        </a>
                      )}

                    {interview.status === "SCHEDULED" && (
                      <button
                        onClick={() => completeMutation.mutate(interview.id)}
                        disabled={completeMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                      </button>
                    )}

                    <Link
                      to={`/interviewer/interviews/${interview.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 border border-slate-200 transition"
                    >
                      {interview.hasFeedback
                        ? "View Evaluation"
                        : "Evaluate & Feedback"}{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>
                      {startDate.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {startDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-indigo-600" />
                    <span>
                      Evaluation:{" "}
                      {interview.hasFeedback ? (
                        <strong className="text-emerald-700">
                          Submitted ({interview.overallRating}/5)
                        </strong>
                      ) : (
                        <strong className="text-amber-700">
                          Pending Feedback
                        </strong>
                      )}
                    </span>
                  </div>

                  {interview.recommendation && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span>
                        Recommendation:{" "}
                        <strong className="text-slate-800">
                          {interview.recommendation.replace("_", " ")}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
