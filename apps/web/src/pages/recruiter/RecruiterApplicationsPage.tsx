import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applications-api";
import { jobsApi } from "@/lib/api/jobs-api";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { ScheduleInterviewDialog } from "@/components/recruiter/ScheduleInterviewDialog";
import type { ApplicationStatus, Application } from "@/types/applications";
import type { Job } from "@/types/jobs";

const statusOptions: { value: ApplicationStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "APPLIED", label: "Applied" },
  { value: "AI_REVIEW", label: "AI Reviewing" },
  { value: "AI_RECOMMENDED", label: "AI Recommended" },
  { value: "RECRUITER_REVIEW", label: "Recruiter Review" },
  { value: "INTERVIEW_APPROVED", label: "Interview Approved" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "INTERVIEW_COMPLETED", label: "Interview Completed" },
  { value: "EVALUATION_PENDING", label: "Evaluation Pending" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" },
];

export function RecruiterApplicationsPage() {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">(
    "",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: jobsData } = useQuery({
    queryKey: ["recruiterJobsList"],
    queryFn: () => jobsApi.getRecruiterJobs({ page: 1, pageSize: 100 }),
  });

  const { data: applicationsData, isLoading } = useQuery({
    queryKey: [
      "companyApplications",
      page,
      selectedJobId,
      selectedStatus,
      searchTerm,
    ],
    queryFn: () =>
      applicationsApi.getCompanyApplications({
        page,
        pageSize: 10,
        jobId: selectedJobId || undefined,
        status: selectedStatus || undefined,
        search: searchTerm || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.approveForInterview(id),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Candidate approved for interview scheduling!");
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
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
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.rejectApplication(id),
    onSuccess: () => {
      setActionError(null);
      setActionSuccess("Application rejected.");
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

  return (
    <div className="space-y-8">
      {/* Action Messages */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium leading-relaxed">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Approval Blocked</span>
            <p className="text-slate-700 leading-relaxed">{actionError}</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Application Submissions & Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review candidate applications, AI-generated match evaluations, and
            manage interview approvals.
          </p>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400 pl-1" />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Job Filter */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white text-slate-700">
              All Job Openings
            </option>
            {jobsData?.items.map((job: Job) => (
              <option
                key={job.id}
                value={job.id}
                className="bg-white text-slate-800"
              >
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as ApplicationStatus | "");
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-slate-800"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table / Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : applicationsData && applicationsData.items.length > 0 ? (
          applicationsData.items.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-bold text-slate-900">
                    {app.candidateName}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({app.candidateEmail})
                  </span>
                  <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold">
                    {app.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    Role: {app.jobTitle}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> Applied{" "}
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </span>
                  {app.coverLetter && (
                    <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Has Cover Letter
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {app.resumeSnapshotUrl && (
                  <a
                    href={app.resumeSnapshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" /> Resume
                  </a>
                )}

                {/* Schedulability-aware Actions */}
                {(app.status === "APPLIED" ||
                  app.status === "AI_REVIEW" ||
                  app.status === "AI_RECOMMENDED" ||
                  app.status === "RECRUITER_REVIEW") && (
                  <button
                    onClick={() => approveMutation.mutate(app.id)}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2 text-xs font-semibold transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{" "}
                    Approve Interview
                  </button>
                )}

                {app.status === "INTERVIEW_APPROVED" && (
                  <button
                    type="button"
                    onClick={() => setSchedulingApp(app)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-2 text-xs font-semibold transition cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    Schedule Interview
                  </button>
                )}

                {app.status === "INTERVIEW_SCHEDULED" && (
                  <Link
                    to="/recruiter/interviews"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-2 text-xs font-semibold transition"
                  >
                    Interview Scheduled
                  </Link>
                )}

                {app.status !== "REJECTED" && (
                  <button
                    onClick={() => rejectMutation.mutate(app.id)}
                    disabled={rejectMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-2 text-xs font-semibold transition cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                )}

                <Link
                  to={`/recruiter/applications/${app.id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold transition shadow-sm"
                >
                  Review Candidate <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <Users className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              No candidates found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No applications match the current filter criteria or have been
              submitted yet.
            </p>
          </div>
        )}
      </div>

      {/* Schedule Interview Dialog */}
      <ScheduleInterviewDialog
        isOpen={!!schedulingApp}
        onClose={() => setSchedulingApp(null)}
        applicationId={schedulingApp?.id}
        candidateName={schedulingApp?.candidateName}
        jobTitle={schedulingApp?.jobTitle}
        candidateId={schedulingApp?.candidateId}
        aiWorkflowId={schedulingApp?.aiWorkflowId}
        onSuccess={() => {
          setActionSuccess("Technical interview scheduled successfully!");
          queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
          setTimeout(() => setActionSuccess(null), 4000);
        }}
      />
    </div>
  );
}
