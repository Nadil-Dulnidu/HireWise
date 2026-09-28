import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Video,
  User,
  Building,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { InterviewStatus } from "@/types/interviews";
import { getGoogleCalendarUrl } from "@/lib/utils";

const getStatusBadge = (status: InterviewStatus) => {
  switch (status) {
    case "SCHEDULED":
      return {
        label: "Scheduled & Confirmed",
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
        label: "Interview Completed",
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
    default:
      return {
        label: status,
        color: "text-slate-700",
        bg: "bg-slate-50",
        border: "border-slate-200",
      };
  }
};

export function CandidateInterviewDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: interview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviewDetail", id],
    queryFn: () => interviewsApi.getInterviewById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading interview details...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          Interview Not Found
        </h3>
        <p className="text-sm text-slate-600">
          Could not retrieve the interview record.
        </p>
        <Link
          to="/candidate/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 border border-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(interview.status);
  const startDate = new Date(interview.scheduledStartTime);
  const endDate = new Date(interview.scheduledEndTime);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/candidate/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Interviews
      </Link>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {interview.jobTitle}
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />{" "}
              {interview.companyName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {interview.meetingLink && interview.status === "SCHEDULED" && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition shadow-sm"
              >
                <Video className="h-4 w-4" /> Join Video Meeting
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold transition shadow-sm"
                title="Add to Google Calendar"
              >
                <CalendarPlus className="h-4 w-4 text-blue-600" /> Add to Calendar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Timing & Logistics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" /> Date & Time
          </h3>

          <div className="space-y-3 text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-semibold text-slate-900">
                  {startDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Time Window</p>
                <p className="font-semibold text-slate-900">
                  {startDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {endDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  (UTC)
                </p>
              </div>
            </div>

            {interview.meetingLink && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-500">Meeting Room</p>
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline truncate block"
                  >
                    {interview.meetingLink}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Interviewer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" /> Assigned Interviewer
          </h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
                {interview.interviewerName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {interview.interviewerName}
                </p>
                <p className="text-xs text-slate-500">Technical Interviewer</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              Email:{" "}
              <span className="text-slate-700 font-medium">
                {interview.interviewerEmail}
              </span>
            </p>
          </div>

          {interview.notes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="text-xs font-semibold text-slate-700">
                Notes from Recruiter
              </p>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">
                {interview.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preparation Guide Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-indigo-600" /> Tips for Your
          Technical Interview
        </h3>
        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
          <li>
            Ensure your microphone, camera, and internet connection are tested
            before the session.
          </li>
          <li>
            Have a code editor or IDE ready if live coding or architecture
            walkthrough is required.
          </li>
          <li>
            Be prepared to explain your past projects and problem-solving
            decisions in detail.
          </li>
        </ul>
      </div>
    </div>
  );
}
