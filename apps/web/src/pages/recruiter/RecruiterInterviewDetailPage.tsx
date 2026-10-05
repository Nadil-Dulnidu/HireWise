import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewsApi } from "@/lib/api/interviews-api";
import { applicationsApi } from "@/lib/api/applications-api";
import {
  ArrowLeft,
  CalendarPlus,
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
  Mail,
  Send,
  Sparkles,
  X,
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

  // Decision Modal and Feedback State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<"SELECTED" | "REJECTED" | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    mutationFn: ({
      status,
      notes,
    }: {
      status: "SELECTED" | "REJECTED";
      notes?: string;
    }) =>
      applicationsApi.updateApplicationStatus(interview!.applicationId, {
        status,
        notes: notes?.trim() || undefined,
      }),
    onSuccess: (_, variables) => {
      setDecisionModalOpen(false);
      setCustomNotes("");
      setErrorMessage(null);
      const isOffer = variables.status === "SELECTED";
      setSuccessMessage(
        isOffer
          ? `🎉 Job offer successfully extended to ${interview?.candidateName}! An official offer email was dispatched to ${interview?.candidateEmail}.`
          : `Decision recorded: Candidate marked as Not Selected. A professional closing email was dispatched to ${interview?.candidateEmail}.`
      );
      queryClient.invalidateQueries({ queryKey: ["interviewDetail", id] });
      queryClient.invalidateQueries({
        queryKey: ["recruiterApplicationDetail", interview?.applicationId],
      });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      setTimeout(() => setSuccessMessage(null), 8000);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update candidate status. Please try again.";
      setErrorMessage(msg);
    },
  });

  const handleOpenDecisionModal = (type: "SELECTED" | "REJECTED") => {
    setDecisionType(type);
    setDecisionModalOpen(true);
    setErrorMessage(null);
  };

  const handleConfirmDecision = () => {
    if (!decisionType || !interview?.applicationId) return;
    updateStatusMutation.mutate({
      status: decisionType,
      notes: customNotes,
    });
  };

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
      {/* Action Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Action Complete</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 text-xs p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Decision Update Error</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-xs p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 transition shadow-sm"
                title="Add to Google Calendar"
              >
                <CalendarPlus className="h-4 w-4 text-blue-600" /> Add to Calendar
              </a>
            )}
            <Link
              to={`/recruiter/applications/${interview.applicationId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition shadow-sm"
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
          <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" /> Final Hiring Decision
              </h3>
              {interview.applicationStatus && (
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    interview.applicationStatus === "SELECTED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : interview.applicationStatus === "REJECTED"
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-blue-100 text-blue-800 border border-blue-300"
                  }`}
                >
                  {interview.applicationStatus.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {interview.applicationStatus === "SELECTED" ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Candidate Selected & Offer Extended
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  An official job offer notification was emailed to{" "}
                  <strong>{interview.candidateEmail}</strong> with recruiter & company details and next onboarding steps.
                </p>
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Need to revise?</span>
                  <button
                    onClick={() => handleOpenDecisionModal("REJECTED")}
                    className="text-red-600 hover:text-red-800 font-semibold cursor-pointer underline"
                  >
                    Change to Reject
                  </button>
                </div>
              </div>
            ) : interview.applicationStatus === "REJECTED" ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Candidate Not Selected
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A respectful closing notification was emailed to{" "}
                  <strong>{interview.candidateEmail}</strong>.
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Need to revise?</span>
                  <button
                    onClick={() => handleOpenDecisionModal("SELECTED")}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                  >
                    Change to Make Offer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review the completed evaluator rubric. Choosing an action will update the candidate's status and automatically send a professional decision email.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleOpenDecisionModal("SELECTED")}
                    disabled={updateStatusMutation.isPending}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Make Offer
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal("REJECTED")}
                    disabled={updateStatusMutation.isPending}
                    className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* Decision Confirmation Modal Dialog */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {decisionType === "SELECTED" ? (
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Award className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
                    <XCircle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {decisionType === "SELECTED"
                      ? "Extend Job Offer"
                      : "Send Rejection Notice"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {decisionType === "SELECTED"
                      ? "Approve candidate and trigger official offer email"
                      : "Politely decline candidate and dispatch closing email"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModalOpen(false)}
                disabled={updateStatusMutation.isPending}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Candidate & Position Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-semibold text-slate-800">
                  {interview.candidateName} ({interview.candidateEmail})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Position:</span>
                <span className="font-semibold text-slate-800">
                  {interview.jobTitle}
                </span>
              </div>
              {feedback && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Interviewer Rubric:</span>
                  <span className="font-semibold text-slate-800">
                    {feedback.overallRating}/5.0 (
                    {feedback.recommendation?.replace(/_/g, " ")})
                  </span>
                </div>
              )}
            </div>

            {/* Informational callout */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                decisionType === "SELECTED"
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              {decisionType === "SELECTED" ? (
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    A professional offer email will be dispatched to{" "}
                    <strong>{interview.candidateEmail}</strong> with recruiter &
                    company sign-off, outlining next formal steps.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    A respectful closing email will be dispatched to{" "}
                    <strong>{interview.candidateEmail}</strong> thanking them for
                    their interview and keeping them in your talent network.
                  </span>
                </div>
              )}
            </div>

            {/* Optional Personal Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Personalized Recruiter Note{" "}
                <span className="text-slate-400 font-normal">
                  (Included in candidate's email)
                </span>
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={3}
                placeholder={
                  decisionType === "SELECTED"
                    ? "e.g., We were thoroughly impressed by your system design answers and look forward to welcoming you aboard!"
                    : "e.g., Thank you for your insightful questions during the technical interview. We wish you the best in your career!"
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={updateStatusMutation.isPending}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 ${
                  decisionType === "SELECTED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {decisionType === "SELECTED"
                  ? "Confirm & Send Offer Email"
                  : "Confirm & Send Rejection Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
