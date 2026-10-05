import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applications-api";
import {
  aiApi,
  type ApplicationWorkflowResponse,
  type GeneratedQuestion,
  type CandidateEvaluation,
  type ResumeAnalysis,
  type QuestionCategory,
  type DifficultyLevel,
} from "@/lib/api/ai-api";
import { ScheduleInterviewDialog } from "@/components/recruiter/ScheduleInterviewDialog";
import {
  FileText,
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Bot,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Send,
  HelpCircle,
} from "lucide-react";
import type { ApplicationStatus } from "@/types/applications";

const allStatuses: { value: ApplicationStatus; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "AI_REVIEW", label: "AI Review in Progress" },
  { value: "AI_RECOMMENDED", label: "AI Recommended" },
  { value: "RECRUITER_REVIEW", label: "Recruiter Review" },
  { value: "INTERVIEW_APPROVED", label: "Interview Approved" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "INTERVIEW_COMPLETED", label: "Interview Completed" },
  { value: "EVALUATION_PENDING", label: "Evaluation Pending" },
  { value: "SELECTED", label: "Selected / Offer" },
  { value: "REJECTED", label: "Rejected" },
];

function normalizeQuestions(arr: any[]): GeneratedQuestion[] {
  return arr
    .map((q) => {
      if (typeof q === "string") {
        try {
          q = JSON.parse(q);
        } catch {
          return {
            category: "TECHNICAL" as QuestionCategory,
            question: q,
            rationale: "",
            expected_answer_rubric: "",
            difficulty: "MEDIUM" as DifficultyLevel,
          };
        }
      }
      return {
        category: (q?.category || q?.Category || "TECHNICAL") as QuestionCategory,
        question: q?.question || q?.Question || q?.text || "",
        rationale: q?.rationale || q?.Rationale || "",
        expected_answer_rubric:
          q?.expected_answer_rubric ||
          q?.expectedAnswerRubric ||
          q?.rubric ||
          q?.Rubric ||
          "",
        difficulty: (q?.difficulty || q?.Difficulty || "MEDIUM") as DifficultyLevel,
      };
    })
    .filter((q) => q.question.trim().length > 0);
}

function extractQuestions(workflowResponse: any): GeneratedQuestion[] {
  if (!workflowResponse) return [];
  const wf = workflowResponse.workflow || workflowResponse;
  const candidates: any[] = [];

  // 1. Check final_result and variants
  const finalResult = wf.final_result || wf.finalResult || wf.FinalResult;
  if (finalResult) {
    if (finalResult.interview_questions) candidates.push(finalResult.interview_questions);
    if (finalResult.interviewQuestions) candidates.push(finalResult.interviewQuestions);
    if (finalResult.questions) candidates.push(finalResult.questions);
    if (finalResult.tailored_questions) candidates.push(finalResult.tailored_questions);
  }

  // 2. Check steps array
  const steps: any[] = wf.steps || wf.Steps || [];
  for (const step of steps) {
    const sName = (step.step_name || step.stepName || step.StepName || "").toUpperCase();
    const aName = (step.agent_name || step.agentName || step.AgentName || "").toLowerCase();

    if (
      sName === "QUESTION_GENERATION" ||
      sName.includes("QUESTION") ||
      aName.includes("question")
    ) {
      const output = step.output_data ?? step.outputData ?? step.OutputJson ?? step.output_json;
      if (output) {
        candidates.push(output);
      }
    }
  }

  // 3. Extract and parse array from candidate containers
  for (let item of candidates) {
    if (!item) continue;

    // Handle stringified JSON
    if (typeof item === "string") {
      try {
        item = JSON.parse(item);
      } catch {
        continue;
      }
    }

    // Direct array of questions
    if (Array.isArray(item) && item.length > 0) {
      const parsed = normalizeQuestions(item);
      if (parsed.length > 0) return parsed;
    }

    // Object container
    if (item && typeof item === "object") {
      const qList =
        item.questions ||
        item.Questions ||
        item.interview_questions ||
        item.interviewQuestions;

      if (Array.isArray(qList) && qList.length > 0) {
        const parsed = normalizeQuestions(qList);
        if (parsed.length > 0) return parsed;
      }

      if (typeof qList === "string") {
        try {
          const parsedStr = JSON.parse(qList);
          if (Array.isArray(parsedStr) && parsedStr.length > 0) {
            const parsed = normalizeQuestions(parsedStr);
            if (parsed.length > 0) return parsed;
          }
        } catch {}
      }

      // Check double-nested: item.interview_questions.questions
      if (item.interview_questions && typeof item.interview_questions === "object") {
        const nested = item.interview_questions.questions;
        if (Array.isArray(nested) && nested.length > 0) {
          const parsed = normalizeQuestions(nested);
          if (parsed.length > 0) return parsed;
        }
      }
    }
  }

  return [];
}

function extractEvaluation(workflowResponse: any): CandidateEvaluation | undefined {
  if (!workflowResponse) return undefined;
  const wf = workflowResponse.workflow || workflowResponse;

  const finalResult = wf.final_result || wf.finalResult;
  let candidate =
    finalResult?.candidate_evaluation ||
    finalResult?.candidateEvaluation ||
    finalResult?.evaluation ||
    finalResult?.Evaluation;

  if (!candidate) {
    const steps: any[] = wf.steps || wf.Steps || [];
    const evalStep = steps.find((s) => {
      const sName = (s.step_name || s.stepName || "").toUpperCase();
      const aName = (s.agent_name || s.agentName || "").toLowerCase();
      return (
        sName === "CANDIDATE_EVALUATION" ||
        sName.includes("EVALUATION") ||
        aName.includes("evaluat")
      );
    });
    if (evalStep) {
      candidate = evalStep.output_data ?? evalStep.outputData ?? evalStep.OutputJson;
    }
  }

  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {}
  }

  if (candidate && typeof candidate === "object") {
    return {
      overall_match_score: candidate.overall_match_score ?? candidate.overallMatchScore ?? 0,
      skill_match_percentage: candidate.skill_match_percentage ?? candidate.skillMatchPercentage ?? 0,
      experience_match_percentage: candidate.experience_match_percentage ?? candidate.experienceMatchPercentage ?? 0,
      strengths: Array.isArray(candidate.strengths) ? candidate.strengths : [],
      identified_gaps: Array.isArray(candidate.identified_gaps ?? candidate.identifiedGaps)
        ? candidate.identified_gaps ?? candidate.identifiedGaps
        : [],
      recommendation: candidate.recommendation || "HIRE",
      recommendation_reasoning:
        candidate.recommendation_reasoning || candidate.recommendationReasoning || "",
    };
  }

  return undefined;
}

function extractResumeAnalysis(workflowResponse: any): ResumeAnalysis | undefined {
  if (!workflowResponse) return undefined;
  const wf = workflowResponse.workflow || workflowResponse;

  const finalResult = wf.final_result || wf.finalResult;
  let resume =
    finalResult?.resume_analysis ||
    finalResult?.resumeAnalysis ||
    finalResult?.resume;

  if (!resume) {
    const steps: any[] = wf.steps || wf.Steps || [];
    const resumeStep = steps.find((s) => {
      const sName = (s.step_name || s.stepName || "").toUpperCase();
      const aName = (s.agent_name || s.agentName || "").toLowerCase();
      return (
        sName === "RESUME_ANALYSIS" ||
        sName.includes("RESUME") ||
        aName.includes("resume")
      );
    });
    if (resumeStep) {
      resume = resumeStep.output_data ?? resumeStep.outputData ?? resumeStep.OutputJson;
    }
  }

  if (typeof resume === "string") {
    try {
      resume = JSON.parse(resume);
    } catch {}
  }

  if (resume && typeof resume === "object") {
    return {
      candidate_name: resume.candidate_name || resume.candidateName,
      extracted_skills: Array.isArray(resume.extracted_skills ?? resume.extractedSkills)
        ? resume.extracted_skills ?? resume.extractedSkills
        : [],
      years_of_experience: resume.years_of_experience ?? resume.yearsOfExperience ?? 0,
      education_history: Array.isArray(resume.education_history ?? resume.educationHistory)
        ? resume.education_history ?? resume.educationHistory
        : [],
      project_highlights: Array.isArray(resume.project_highlights ?? resume.projectHighlights)
        ? resume.project_highlights ?? resume.projectHighlights
        : [],
      certifications: Array.isArray(resume.certifications) ? resume.certifications : [],
      executive_summary: resume.executive_summary || resume.executiveSummary || "",
    };
  }

  return undefined;
}

export function RecruiterApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [aiActiveTab, setAiActiveTab] = useState<"overview" | "skills" | "questions">("overview");

  // 1. Fetch Application Detail
  const {
    data: application,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["recruiterApplicationDetail", id],
    queryFn: () => applicationsApi.getApplicationById(id!),
    enabled: !!id,
  });

  // 2. Fetch AI Workflow Evaluation Intelligence
  const {
    data: appWorkflow,
    isLoading: isAppWorkflowLoading,
  } = useQuery<ApplicationWorkflowResponse>({
    queryKey: ["applicationWorkflow", id],
    queryFn: () => aiApi.getApplicationWorkflow(id!),
    enabled: !!id,
  });

  // Direct workflow fallback query if application workflow is missing
  const {
    data: directWorkflow,
    isLoading: isDirectWorkflowLoading,
  } = useQuery({
    queryKey: ["workflowDetailDirect", application?.aiWorkflowId],
    queryFn: () => aiApi.getWorkflowDetails(application!.aiWorkflowId!),
    enabled: !!application?.aiWorkflowId && (!appWorkflow || !appWorkflow.workflow),
  });

  const effectiveWorkflow = appWorkflow?.workflow
    ? appWorkflow
    : directWorkflow
      ? { workflow: directWorkflow }
      : undefined;

  const wf = effectiveWorkflow?.workflow;
  const isSchedulingAgentComplete =
    application?.status === "INTERVIEW_APPROVED" ||
    wf?.status === "AWAITING_SCHEDULE_APPROVAL" ||
    wf?.status === "COMPLETED" ||
    wf?.current_step === "SCHEDULE_APPROVAL_GATE" ||
    wf?.current_step === "SCHEDULE_APPROVAL" ||
    Boolean(
      wf?.final_result?.scheduling_recommendation ||
      wf?.final_result?.schedulingRecommendation
    ) ||
    (wf?.steps || []).some(
      (s: any) =>
        (s.agent_name?.toLowerCase().includes("scheduling") ||
         s.step_name?.toUpperCase() === "SCHEDULING") &&
        s.status === "COMPLETED"
    );

  const isWorkflowLoading = isAppWorkflowLoading || (isDirectWorkflowLoading && !effectiveWorkflow);

  // 3. Fetch Scheduling Readiness (Interviewers, Interviewer Slots, Candidate Slots)
  const {
    data: readiness,
    refetch: refetchReadiness,
  } = useQuery({
    queryKey: ["schedulingReadiness", id],
    queryFn: () => applicationsApi.getSchedulingReadiness(id!),
    enabled: !!id,
  });

  // Trigger manual evaluation mutation
  const triggerEvalMutation = useMutation({
    mutationFn: (appId: string) => aiApi.triggerEvaluation(appId),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("AI evaluation workflow initiated! Analysis will update automatically.");
      queryClient.invalidateQueries({ queryKey: ["applicationWorkflow", id] });
      queryClient.invalidateQueries({ queryKey: ["recruiterApplicationDetail", id] });
      if (application?.aiWorkflowId) {
        queryClient.invalidateQueries({ queryKey: ["workflowDetailDirect", application.aiWorkflowId] });
      }
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionSuccess(null);
      setActionError(
        err?.response?.data?.error || err.message || "Failed to trigger AI evaluation"
      );
    },
  });

  // Status progression mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      applicationsApi.updateApplicationStatus(id!, {
        status,
        notes: statusNotes || undefined,
      }),
    onSuccess: (data) => {
      setActionError(null);
      setActionSuccess(
        `Application status updated to ${data?.status?.replace(/_/g, " ") || "updated status"}`
      );
      queryClient.invalidateQueries({
        queryKey: ["recruiterApplicationDetail", id],
      });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["schedulingReadiness", id] });
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionSuccess(null);
      setActionError(
        err?.response?.data?.error || err.message || "Failed to update status"
      );
    },
  });

  // Approve candidate for interview mutation
  const approveMutation = useMutation({
    mutationFn: () => applicationsApi.approveForInterview(id!),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess(
        "Candidate approved for technical interview scheduling! You can now proceed to schedule."
      );
      queryClient.invalidateQueries({
        queryKey: ["recruiterApplicationDetail", id],
      });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["schedulingReadiness", id] });
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionSuccess(null);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to approve candidate for interview.";
      setActionError(errMsg);
      // Refresh readiness in case slots changed or email was sent
      refetchReadiness();
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.rejectApplication(id!),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Application marked as rejected.");
      queryClient.invalidateQueries({
        queryKey: ["recruiterApplicationDetail", id],
      });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionSuccess(null);
      setActionError(
        err?.response?.data?.error || err.message || "Failed to reject application"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="bg-white max-w-md mx-auto p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
        <p className="text-xs text-slate-500">
          The application may have been removed or you lack authorization.
        </p>
        <Link
          to="/recruiter/applications"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Candidate Pipeline
        </Link>
      </div>
    );
  }

  // Extract evaluation intelligence with multi-layer fallback & normalization
  const evalData: CandidateEvaluation | undefined = extractEvaluation(effectiveWorkflow);
  const resumeData: ResumeAnalysis | undefined = extractResumeAnalysis(effectiveWorkflow);
  const questionsData: GeneratedQuestion[] = extractQuestions(effectiveWorkflow);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        to="/recruiter/applications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Candidate Pipeline
      </Link>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium leading-relaxed">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Action Blocked</span>
            <p className="text-slate-700 leading-relaxed">{actionError}</p>
          </div>
        </div>
      )}

      {/* Scheduling Pre-Approval Readiness Warning Banner */}
      {readiness && !readiness.canApprove && application.status !== "INTERVIEW_APPROVED" && application.status !== "INTERVIEW_SCHEDULED" && application.status !== "INTERVIEW_COMPLETED" && application.status !== "SELECTED" && application.status !== "REJECTED" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4.5 text-xs text-amber-900 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
            <span>Interview Approval Pre-Conditions</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Before approving an AI-recommended candidate for an interview, availability must be satisfied across all parties:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${readiness.hasInterviewers ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
              {readiness.hasInterviewers ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              <div>
                <span className="font-semibold block text-[11px]">Organization Interviewers</span>
                <span className="text-[10px] opacity-80">{readiness.interviewerCount} assigned</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${readiness.hasInterviewerSlots ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-amber-200 text-amber-800"}`}>
              {readiness.hasInterviewerSlots ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
              <div>
                <span className="font-semibold block text-[11px]">Interviewer Availability</span>
                <span className="text-[10px] opacity-80">{readiness.interviewerSlotCount} active slot(s)</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${readiness.hasCandidateSlots ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-blue-200 text-blue-800"}`}>
              {readiness.hasCandidateSlots ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <Send className="h-4 w-4 text-blue-500 shrink-0" />}
              <div>
                <span className="font-semibold block text-[11px]">Candidate Availability</span>
                <span className="text-[10px] opacity-80">
                  {readiness.hasCandidateSlots ? `${readiness.candidateSlotCount} slot(s) submitted` : "Missing — email will notify"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Candidate Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xl font-bold">
              {application.candidateName[0]}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {application.candidateName}
                </h1>
                <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-0.5 text-xs font-semibold">
                  {application.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Candidate for{" "}
                <span className="text-slate-900 font-bold">
                  {application.jobTitle}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />{" "}
                  {application.candidateEmail}
                </span>
                {application.candidatePhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />{" "}
                    {application.candidatePhone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Applied{" "}
                  {new Date(application.appliedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            {application.resumeSnapshotUrl && (
              <a
                href={application.resumeSnapshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 transition"
              >
                <Download className="h-4 w-4" /> Download Resume
              </a>
            )}

            {/* Schedule Interview Modal Trigger */}
            {application.status === "INTERVIEW_SCHEDULED" ? (
              <Link
                to="/recruiter/interviews"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2.5 text-xs font-semibold transition"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-600" /> View Scheduled Interview
              </Link>
            ) : isSchedulingAgentComplete ? (
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
              >
                <Calendar className="h-4 w-4" /> Schedule Interview
              </button>
            ) : (
              (application.status === "APPLIED" ||
                application.status === "AI_REVIEW" ||
                application.status === "AI_RECOMMENDED" ||
                application.status === "RECRUITER_REVIEW") && (
                <button
                  type="button"
                  disabled
                  title="Enabled after the Scheduling agent execution is complete"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 px-4 py-2.5 text-xs font-semibold cursor-not-allowed opacity-60"
                >
                  <Calendar className="h-4 w-4" /> Schedule Interview
                </button>
              )
            )}

            {(application.status === "APPLIED" ||
              application.status === "AI_REVIEW" ||
              application.status === "AI_RECOMMENDED" ||
              application.status === "RECRUITER_REVIEW") && (
              <button
                type="button"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve for Interview
              </button>
            )}

            {application.status !== "REJECTED" && (
              <button
                type="button"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold transition cursor-pointer"
              >
                <XCircle className="h-4 w-4 text-red-500" /> Reject Application
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Evaluation Intelligence & Cover Letter */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI EVALUATION INTELLIGENCE COMPONENT */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      AI Evaluation Intelligence
                    </h2>
                    <p className="text-xs text-slate-500">
                      LangGraph Multi-Agent autonomous evaluation & gap analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {evalData && (
                  <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Fit Score
                      </span>
                      <span className="text-lg font-extrabold text-emerald-600 leading-none">
                        {evalData.overall_match_score}%
                      </span>
                    </div>
                    <div className="h-7 w-px bg-slate-200"></div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Recommendation
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          evalData.recommendation === "STRONG_HIRE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : evalData.recommendation === "HIRE"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {evalData.recommendation.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => triggerEvalMutation.mutate(application.id)}
                  disabled={triggerEvalMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition disabled:opacity-50"
                  title="Re-run AI Multi-Agent Evaluation"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${triggerEvalMutation.isPending ? "animate-spin" : ""}`}
                  />
                  <span>Re-evaluate</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6">
              {isWorkflowLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-xs text-slate-500">
                    Loading AI evaluation intelligence...
                  </p>
                </div>
              ) : !effectiveWorkflow || !effectiveWorkflow.workflow ? (
                <div className="py-8 text-center space-y-3">
                  <Bot className="h-10 w-10 text-indigo-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Evaluation Not Available Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    The AI multi-agent workflow has not yet completed evaluation for this candidate application. You can trigger it now or inspect the live workflow graph.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => triggerEvalMutation.mutate(application.id)}
                      disabled={triggerEvalMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                    >
                      <Bot className="h-3.5 w-3.5" /> Run AI Evaluation
                    </button>
                    <Link
                      to="/recruiter/ai-workflows"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition"
                    >
                      Multi-Agent Monitor →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Sub-Tabs Navigation */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setAiActiveTab("overview")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        aiActiveTab === "overview"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      Assessment Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiActiveTab("skills")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        aiActiveTab === "skills"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      Extracted Skills ({resumeData?.extracted_skills?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiActiveTab("questions")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        aiActiveTab === "questions"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      Interview Questions ({questionsData.length})
                    </button>
                  </div>

                  {/* Tab 1: Overview */}
                  {aiActiveTab === "overview" && (
                    evalData ? (
                      <div className="space-y-6">
                        {/* Rationale Quote */}
                        {evalData.recommendation_reasoning && (
                          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                            <h4 className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                              <Bot className="h-4 w-4 text-indigo-600" />
                              <span>AI Recommendation Rationale</span>
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              {evalData.recommendation_reasoning}
                            </p>
                          </div>
                        )}

                        {/* Match Percentages Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700">Technical Skill Match</span>
                              <span className="text-blue-600">
                                {evalData.skill_match_percentage ?? 0}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${evalData.skill_match_percentage ?? 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700">Experience Alignment</span>
                              <span className="text-blue-600">
                                {evalData.experience_match_percentage ?? 0}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${evalData.experience_match_percentage ?? 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Strengths & Gaps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Key Candidate Strengths</span>
                            </h4>
                            {evalData.strengths && evalData.strengths.length > 0 ? (
                              <ul className="space-y-2">
                                {evalData.strengths.map((str, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                                    <span>{str}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                                No specific strengths highlighted in rubric.
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <span>Identified Competency Gaps</span>
                            </h4>
                            {evalData.identified_gaps && evalData.identified_gaps.length > 0 ? (
                              <ul className="space-y-2">
                                {evalData.identified_gaps.map((gap, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-slate-700 bg-amber-50/40 p-2.5 rounded-xl border border-amber-200 flex items-start gap-2"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                                No major skill gaps identified against job requirements.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <Bot className="h-6 w-6 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700">Evaluation details pending</p>
                        <p className="text-[11px] text-slate-400">Click "Re-evaluate" to run or refresh the LangGraph evaluation pipeline.</p>
                      </div>
                    )
                  )}

                  {/* Tab 2: Skills & Resume Extraction */}
                  {aiActiveTab === "skills" && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900">
                          Extracted Technical Skills
                        </h4>
                        {resumeData?.extracted_skills && resumeData.extracted_skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {resumeData.extracted_skills.map((skill, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No extracted skills available.</p>
                        )}
                      </div>

                      {resumeData?.executive_summary && (
                        <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-900">
                            Executive Resume Summary
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {resumeData.executive_summary}
                          </p>
                        </div>
                      )}

                      {resumeData?.project_highlights && resumeData.project_highlights.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Project Highlights
                          </h4>
                          <div className="space-y-2">
                            {resumeData.project_highlights.map((proj, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                              >
                                {proj}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Generated Interview Questions */}
                  {aiActiveTab === "questions" && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">
                        Tailored interview questions dynamically generated based on this candidate's resume gaps and job requirements:
                      </p>
                      {questionsData.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <HelpCircle className="h-6 w-6 text-slate-400 mx-auto" />
                          <p className="font-semibold text-slate-700">No tailored interview questions generated yet</p>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            {application.status === "AI_RECOMMENDED" || application.status === "RECRUITER_REVIEW" || application.status === "APPLIED" || application.status === "AI_REVIEW"
                              ? "Interview questions will be dynamically generated by the Question Generator Agent once the candidate is approved for technical interview."
                              : "No interview questions found in the workflow telemetry."}
                          </p>
                        </div>
                      ) : (
                        questionsData.map((q, i) => (
                          <div
                            key={i}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {q.category} • {q.difficulty}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Question {i + 1}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {q.question}
                            </h4>
                            {q.rationale && (
                              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
                                <span className="font-semibold text-indigo-700 shrink-0">Rationale:</span>
                                <span>{q.rationale}</span>
                              </div>
                            )}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                              <span className="text-[11px] font-semibold text-slate-500 block">
                                Expected Rubric / Evaluation Criteria:
                              </span>
                              <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-mono text-[11px] whitespace-pre-line">
                                {q.expected_answer_rubric}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Candidate Cover Letter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" /> Candidate Cover Letter & Notes
            </h2>
            {application.coverLetter ? (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line">
                {application.coverLetter}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No cover letter was submitted with this application.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Status Transition & Scheduling Details */}
        <div className="space-y-6">
          {/* Scheduling Status Overview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" /> Interview & Scheduling Status
            </h2>

            {application.status === "INTERVIEW_SCHEDULED" ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>Interview is Scheduled</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  The candidate interview has been successfully scheduled. You can track progress or review feedback on the Interviews dashboard.
                </p>
                <Link
                  to="/recruiter/interviews"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  View in Interviews →
                </Link>
              </div>
            ) : (application.status === "INTERVIEW_APPROVED" || isSchedulingAgentComplete) ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Ready for Scheduling</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  The scheduling agent execution is complete and time slot recommendations are ready. Click below to pick an available slot.
                </p>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                >
                  <Calendar className="h-4 w-4" /> Schedule Interview Now
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <span className="font-semibold block text-slate-800">Status: {application.status.replace(/_/g, " ")}</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The scheduling agent will automatically run and enable the Schedule Interview button once candidate evaluation and availability are processed.
                </p>
              </div>
            )}
          </div>

          {/* Manual Status Progression Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Manual Status Progression
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">
                  New Status
                </label>
                <select
                  value={selectedStatus || application.status}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ApplicationStatus)
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
                >
                  {allStatuses.map((s) => (
                    <option
                      key={s.value}
                      value={s.value}
                      className="bg-white text-slate-800"
                    >
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">
                  Status Change Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason for status change..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedStatus && selectedStatus !== application.status) {
                    updateStatusMutation.mutate(selectedStatus as ApplicationStatus);
                  }
                }}
                disabled={
                  updateStatusMutation.isPending ||
                  !selectedStatus ||
                  selectedStatus === application.status
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
              >
                {updateStatusMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Update Candidate Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal Dialog */}
      <ScheduleInterviewDialog
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        applicationId={application.id}
        candidateName={application.candidateName}
        jobTitle={application.jobTitle}
        candidateId={application.candidateId}
        aiWorkflowId={application.aiWorkflowId}
        onSuccess={() => {
          setActionSuccess("Technical interview successfully scheduled!");
          queryClient.invalidateQueries({ queryKey: ["recruiterApplicationDetail", id] });
          queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
          setTimeout(() => setActionSuccess(null), 4000);
        }}
      />
    </div>
  );
}
