import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarPlus,
  Clock,
  Video,
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Star,
  AlertTriangle,
} from "lucide-react";
import { ScheduleInterviewDialog } from "@/components/recruiter/ScheduleInterviewDialog";
import type { InterviewStatus } from "@/types/interviews";
import { getGoogleCalendarUrl } from "@/lib/utils";

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

export function RecruiterInterviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page] = useState(1);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["recruiterInterviews", page, statusFilter, searchTerm],
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

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      interviewsApi.cancelInterview(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiterInterviews"] });
      setCancelModalId(null);
      setCancelReason("");
    },
  });

  const interviews = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-indigo-600" /> Company Interviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Oversee all scheduled, active, and completed technical rounds across
            your company.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsScheduleModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Schedule New Interview
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, role, or interviewer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 w-full sm:w-auto"
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
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">
            Loading company interviews...
          </p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <Users className="h-8 w-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No interviews found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by scheduling an interview for an approved candidate
            application.
          </p>
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Schedule Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const badge = getStatusBadge(interview.status);
            const startDate = new Date(interview.scheduledStartTime);
            const endDate = new Date(interview.scheduledEndTime);

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
                      • Interviewer:{" "}
                      <span className="text-indigo-700 font-medium">
                        {interview.interviewerName}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {interview.meetingLink && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 border border-slate-200 transition"
                      >
                        <Video className="h-3.5 w-3.5 text-emerald-600" /> Meet Link
                      </a>
                    )}

                    {interview.status === "SCHEDULED" && (
                      <a
                        href={getGoogleCalendarUrl({
                          title: `Technical Interview: ${interview.jobTitle} — ${interview.candidateName || interview.candidateEmail}`,
                          startTime: interview.scheduledStartTime,
                          endTime: interview.scheduledEndTime,
                          description: `HireWise Technical Interview\nPosition: ${interview.jobTitle}\nCandidate: ${interview.candidateName || ""} (${interview.candidateEmail})\nInterviewer: ${interview.interviewerName || ""}\nMeeting Link: ${interview.meetingLink || "N/A"}\nNotes: ${interview.notes || "None"}`,
                          location: interview.meetingLink,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50/70 text-xs font-semibold text-indigo-700 border border-indigo-200 transition shadow-sm"
                        title="Add to Google Calendar"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-indigo-600" /> Calendar
                      </a>
                    )}

                    {interview.status === "SCHEDULED" && (
                      <button
                        onClick={() => setCancelModalId(interview.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium transition cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}

                    <Link
                      to={`/recruiter/interviews/${interview.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium transition"
                    >
                      {interview.hasFeedback ? "Review Feedback" : "Details"}{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
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
                      })}{" "}
                      -{" "}
                      {endDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>
                      Feedback:{" "}
                      {interview.hasFeedback ? (
                        <strong className="text-emerald-700">
                          Submitted ({interview.overallRating}/5.0)
                        </strong>
                      ) : (
                        <span className="text-slate-400">Pending</span>
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

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Cancel Interview
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this interview session? The
              candidate and interviewer will be notified and the application
              returned to approved state.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Cancellation Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Candidate requested reschedule, etc."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalId(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                Keep Scheduled
              </button>
              <button
                type="button"
                onClick={() =>
                  cancelMutation.mutate({
                    id: cancelModalId,
                    reason: cancelReason,
                  })
                }
                disabled={cancelMutation.isPending}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {cancelMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Dialog */}
      <ScheduleInterviewDialog
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["recruiterInterviews"] });
          queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
        }}
      />
    </div>
  );
}
