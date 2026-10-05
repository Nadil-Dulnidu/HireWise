import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import { Link } from "react-router-dom";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Video,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";
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
        color: "text-rose-700",
        bg: "bg-rose-50",
        border: "border-rose-200",
      };
    case "NO_SHOW":
      return {
        label: "No Show",
        color: "text-slate-600",
        bg: "bg-slate-100",
        border: "border-slate-200",
      };
    default:
      return {
        label: status,
        color: "text-slate-700",
        bg: "bg-slate-50",
        border: "border-slate-200",
      };
  }
};

export function CandidateInterviewsPage() {
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["myInterviews", page],
    queryFn: () => interviewsApi.getMyInterviews({ page, pageSize: 10 }),
  });

  const interviews = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            My Interviews
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track your scheduled interview sessions and prepare for technical
            rounds.
          </p>
        </div>
        <Link
          to="/candidate/availability"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 border border-slate-200 transition"
        >
          <Clock className="h-4 w-4 text-slate-500" /> Manage My Availability
        </Link>
      </div>

      {/* Interviews List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading your interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No interviews scheduled yet
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            When recruiters review and approve your applications, you will
            receive interview invites here.
          </p>
          <Link
            to="/candidate/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition shadow-sm"
          >
            Check Application Status <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((interview) => {
            const badge = getStatusBadge(interview.status);
            const startDate = new Date(interview.scheduledStartTime);
            const endDate = new Date(interview.scheduledEndTime);

            return (
              <div
                key={interview.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-slate-500 font-medium truncate">
                      {interview.companyName}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${badge.bg} ${badge.color} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                      {interview.jobTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                      <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">
                        Interviewer: <strong className="text-slate-800 font-medium">{interview.interviewerName || "Hiring Team"}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>
                        {startDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>
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
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {interview.meetingLink && interview.status === "SCHEDULED" && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Meeting
                      </a>
                    )}
                    {interview.status === "SCHEDULED" && (
                      <a
                        href={getGoogleCalendarUrl({
                          title: `Technical Interview: ${interview.jobTitle} at ${interview.companyName}`,
                          startTime: interview.scheduledStartTime,
                          endTime: interview.scheduledEndTime,
                          description: `HireWise Technical Interview\nPosition: ${interview.jobTitle}\nCompany: ${interview.companyName}\nInterviewer: ${interview.interviewerName || "Hiring Team"}\nMeeting Link: ${interview.meetingLink || "N/A"}\nNotes: ${interview.notes || "None"}`,
                          location: interview.meetingLink,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-xs"
                        title="Add to Google Calendar"
                      >
                        <CalendarPlus className="h-4 w-4 text-blue-600" />
                      </a>
                    )}
                  </div>
                  <Link
                    to={`/candidate/interviews/${interview.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition"
                  >
                    View Details <ArrowRight className="h-3.5 w-3.5" />
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
