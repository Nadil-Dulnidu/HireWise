import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api/jobs-api";
import { applicationsApi } from "@/lib/api/applications-api";
import { resumesApi } from "@/lib/api/resumes-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  ArrowLeft,
  Bot,
  Users,
  CheckCircle2,
  Share2,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  X,
  FileCheck2,
} from "lucide-react";

// Job detail page showing position requirements, company info, and application flow
export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSignedIn } = useCurrentUser();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Fetch job posting details by ID from route parameters
  const {
    data: job,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["jobDetail", id],
    queryFn: () => jobsApi.getJobById(id!),
    enabled: !!id,
  });

  // Fetch candidate's active resume when application modal is open
  const {
    data: activeResume,
    isLoading: isResumeLoading,
    refetch: refetchResume,
  } = useQuery({
    queryKey: ["myResume"],
    queryFn: async () => {
      try {
        return await resumesApi.getMyActiveResume();
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: isSignedIn && isApplyModalOpen,
  });

  // Mutation to upload a new resume directly from the application modal
  const uploadResumeMutation = useMutation({
    mutationFn: (file: File) => resumesApi.uploadResume(file),
    onSuccess: () => {
      setApplyError(null);
      refetchResume();
      queryClient.invalidateQueries({ queryKey: ["myResume"] });
    },
    onError: (err: any) => {
      setApplyError(
        err?.response?.data?.error || err.message || "Failed to upload resume",
      );
    },
  });

  // Mutation to submit candidate job application with optional cover letter
  const applyMutation = useMutation({
    mutationFn: (data: { coverLetter?: string }) =>
      applicationsApi.applyToJob(id!, data),
    onSuccess: () => {
      setApplySuccess(true);
      queryClient.invalidateQueries({ queryKey: ["myApplications"] });
      queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
      setTimeout(() => {
        setIsApplyModalOpen(false);
        navigate("/candidate/applications");
      }, 2000);
    },
    onError: (err: any) => {
      setApplyError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to submit application",
      );
    },
  });

  // Helper to format minimum and maximum salary figures with currency
  const formatSalary = (
    min?: number | null,
    max?: number | null,
    currency = "USD",
  ) => {
    if (!min && !max) return "Competitive salary";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    if (min && max)
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `From ${formatter.format(min)}`;
    return `Up to ${formatter.format(max!)}`;
  };

  // Validate sign-in status and open application modal or redirect to sign up
  const handleApplyClick = () => {
    if (!isSignedIn) {
      navigate(`/sign-up?redirect_url=/jobs/${id}`);
    } else {
      setApplyError(null);
      setApplySuccess(false);
      setIsApplyModalOpen(true);
    }
  };

  // Validate active resume and trigger application submission mutation
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResume) {
      setApplyError(
        "Please upload your resume before submitting your application.",
      );
      return;
    }
    setApplyError(null);
    applyMutation.mutate({ coverLetter: coverLetter.trim() || undefined });
  };

  if (isLoading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading job specifications...</p>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          Job opening not found
        </h2>
        <p className="text-sm text-slate-600">
          {(error as Error)?.message ||
            "This job posting may have been closed or removed by the hiring team."}
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to open roles
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to open positions
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                {job.experienceLevel} Level
              </span>
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                {job.employmentType.replace("_", " ")}
              </span>
              {job.status !== "OPEN" && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  Status: {job.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pt-1">
              <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <Building className="h-4 w-4 text-slate-400" />{" "}
                {job.companyName}
              </span>
              {job.departmentName && (
                <span className="text-slate-500">• {job.departmentName}</span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" /> {job.location}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <DollarSign className="h-4 w-4" />{" "}
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={handleApplyClick}
              disabled={job.status !== "OPEN"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 text-sm font-semibold text-white transition shadow-sm cursor-pointer"
            >
              <Bot className="h-4 w-4" />{" "}
              {job.status === "OPEN"
                ? "Apply with AI Match"
                : "Applications Closed"}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Job link copied to clipboard!");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5" /> Share Position
            </button>
          </div>
        </div>

        {/* Meta Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block">Total Applicants</span>
            <span className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-600" />{" "}
              {job.applicationCount} Applied
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block">Posted Date</span>
            <span className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />{" "}
              {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block">Application Deadline</span>
            <span className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              {job.applicationDeadline
                ? new Date(job.applicationDeadline).toLocaleDateString()
                : "Rolling basis"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block">Recruitment Mode</span>
            <span className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5 text-purple-600" /> AI
              Evaluated
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Job Description & Requirements */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" /> Role Overview
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key
              Requirements & Qualifications
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </div>
          </div>
        </div>

        {/* Right: Company Overview Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {job.companyName}
                </h3>
                <p className="text-xs text-slate-500">
                  {job.companyLocation || job.location}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Department</span>
                <span className="font-medium text-slate-900">
                  {job.departmentName || "General Engineering"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Role Type</span>
                <span className="font-medium text-slate-900">
                  {job.employmentType.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Experience</span>
                <span className="font-medium text-slate-900">
                  {job.experienceLevel} Level
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Compensation</span>
                <span className="font-medium text-emerald-600">
                  {formatSalary(
                    job.salaryMin,
                    job.salaryMax,
                    job.salaryCurrency,
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleApplyClick}
              disabled={job.status !== "OPEN"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 text-xs font-semibold text-white transition shadow-sm mt-4 cursor-pointer"
            >
              <Bot className="h-4 w-4" /> Apply for this Position
            </button>
          </div>
        </div>
      </div>

      {/* Apply Modal Dialog */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                Apply to {job.title}
              </h2>
              <p className="text-xs text-slate-500">
                {job.companyName} • {job.location}
              </p>
            </div>

            {applyError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            {applySuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>
                  Application submitted successfully! Redirecting to
                  applications tracker...
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              {/* Resume Status & Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Attached Resume (Required)</span>
                  <Link
                    to="/candidate/resume"
                    target="_blank"
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    Manage Resumes ↗
                  </Link>
                </label>

                {isResumeLoading ? (
                  <div className="p-4 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                ) : activeResume ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {activeResume.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {(activeResume.fileSize / 1024).toFixed(1)} KB •
                          Active
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Ready
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                    <p className="font-medium">
                      No active resume found on your profile.
                    </p>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg bg-amber-100 hover:bg-amber-200 px-3 py-1.5 font-semibold text-amber-800 border border-amber-300 transition">
                      <Upload className="h-3.5 w-3.5" /> Upload Resume PDF/DOCX
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            uploadResumeMutation.mutate(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Cover Letter / Introduction Notes{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share a brief summary of why you are a great fit for this position..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending || !activeResume}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm cursor-pointer"
                >
                  {applyMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Submit Application & Run AI Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
