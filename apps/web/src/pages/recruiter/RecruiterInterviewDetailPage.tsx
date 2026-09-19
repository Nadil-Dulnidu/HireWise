import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import { applicationsApi } from "@/lib/api/applications-api";
import {
  ArrowLeft,
  Clock,
  Video,
  User,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Award,
  ChevronRight,
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

export function RecruiterInterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: interview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviewDetail", id],
    queryFn: () => interviewsApi.getInterviewById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: "SELECTED" | "REJECTED") =>
      applicationsApi.updateApplicationStatus(interview!.applicationId, {
        status: newStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviewDetail", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading interview details...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          Interview Not Found
        </h3>
        <Link
          to="/recruiter/interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Interviews
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(interview.status);
  const feedback = interview.feedback;
  const startDate = new Date(interview.scheduledStartTime);
  const endDate = new Date(interview.scheduledEndTime);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/recruiter/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to All Interviews
      </Link>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {interview.candidateName}
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Role:{" "}
              <span className="text-slate-800 font-medium">
                {interview.jobTitle}
              </span>{" "}
              • {interview.companyName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {interview.meetingLink && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition"
              >
                <Video className="h-4 w-4 text-emerald-600" /> Join Meet
              </a>
            )}
            <Link
              to={`/recruiter/applications/${interview.applicationId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition shadow-sm"
            >
              <FileText className="h-4 w-4" /> View Full Application{" "}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2-Column: Details & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Logistics & Participants */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" /> Schedule Information
            </h3>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500">Date</span>
              <p className="font-semibold text-slate-900">
                {startDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500">Time</span>
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

          {/* Participants */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" /> Participants
            </h3>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500">Candidate</span>
              <p className="font-semibold text-slate-900">
                {interview.candidateName}
              </p>
              <p className="text-slate-500">{interview.candidateEmail}</p>
              {interview.candidatePhone && (
                <p className="text-slate-500">{interview.candidatePhone}</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500">Assigned Evaluator</span>
              <p className="font-semibold text-slate-900">
                {interview.interviewerName}
              </p>
              <p className="text-slate-500">{interview.interviewerEmail}</p>
            </div>
          </div>

          {/* Hiring Decision Actions */}
          {feedback && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-3 bg-indigo-50/30">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" /> Take Final Hiring
                Action
              </h3>
              <p className="text-xs text-slate-500">
                Review completed evaluator rubric and choose whether to issue an
                offer or reject candidate.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => updateStatusMutation.mutate("SELECTED")}
                  disabled={updateStatusMutation.isPending}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Make Offer
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate("REJECTED")}
                  disabled={updateStatusMutation.isPending}
                  className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Evaluator Feedback */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Interviewer Assessment
              & Feedback
            </h3>

            {feedback ? (
              <div className="space-y-5">
                {/* Score Banner */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Overall Score</p>
                    <h4 className="text-3xl font-black text-emerald-700 mt-0.5">
                      {feedback.overallRating}{" "}
                      <span className="text-sm font-normal text-slate-400">
                        / 5.0
                      </span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Evaluator Verdict</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {feedback.recommendation.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">
                      Technical
                    </span>
                    <strong className="text-slate-900 text-sm">
                      {feedback.technicalSkillsRating}/5
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">
                      Problem Solving
                    </span>
                    <strong className="text-slate-900 text-sm">
                      {feedback.problemSolvingRating}/5
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">
                      Communication
                    </span>
                    <strong className="text-slate-900 text-sm">
                      {feedback.communicationRating}/5
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">
                      Cultural Fit
                    </span>
                    <strong className="text-slate-900 text-sm">
                      {feedback.culturalFitRating}/5
                    </strong>
                  </div>
                </div>

                {feedback.strengths && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-emerald-700">
                      Observed Strengths
                    </p>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                      {feedback.strengths}
                    </p>
                  </div>
                )}

                {feedback.weaknesses && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-amber-700">
                      Identified Gaps
                    </p>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                      {feedback.weaknesses}
                    </p>
                  </div>
                )}

                {feedback.notes && (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-600">
                      Evaluator Synthesis
                    </p>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-wrap">
                      {feedback.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <Clock className="h-8 w-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  Evaluation Pending
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {interview.interviewerName} has not yet submitted feedback for
                  this interview. Once completed, scores and rubrics will appear
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
