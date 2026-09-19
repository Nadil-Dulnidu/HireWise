import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, departmentsApi } from "@/lib/api/jobs-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type {
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  Department,
} from "@/types/jobs";
import {
  Briefcase,
  ArrowLeft,
  Save,
  DollarSign,
  Loader2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

export function CreateEditJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    departmentId: "",
    location: "San Francisco, CA / Remote",
    employmentType: "FULL_TIME" as EmploymentType,
    experienceLevel: "MID" as ExperienceLevel,
    salaryMin: 120000,
    salaryMax: 160000,
    salaryCurrency: "USD",
    applicationDeadline: "",
    description: "",
    requirements: "",
    status: "OPEN" as JobStatus,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch departments for company
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", profile?.companyId],
    queryFn: () => departmentsApi.getDepartments(profile?.companyId!),
    enabled: !!profile?.companyId,
  });

  // Fetch job if editing
  const { data: existingJob, isLoading: isLoadingJob } = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.getJobById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingJob) {
      setFormData({
        title: existingJob.title,
        departmentId: existingJob.departmentId || "",
        location: existingJob.location,
        employmentType: existingJob.employmentType,
        experienceLevel: existingJob.experienceLevel,
        salaryMin: existingJob.salaryMin || 0,
        salaryMax: existingJob.salaryMax || 0,
        salaryCurrency: existingJob.salaryCurrency || "USD",
        applicationDeadline: existingJob.applicationDeadline
          ? existingJob.applicationDeadline.split("T")[0]
          : "",
        description: existingJob.description,
        requirements: existingJob.requirements,
        status: existingJob.status,
      });
    }
  }, [existingJob]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title.trim(),
        departmentId: formData.departmentId || undefined,
        location: formData.location.trim(),
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        salaryCurrency: formData.salaryCurrency.trim().toUpperCase(),
        applicationDeadline: formData.applicationDeadline
          ? new Date(formData.applicationDeadline).toISOString()
          : undefined,
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
      };

      if (isEditing) {
        return jobsApi.updateJob(id!, payload);
      } else {
        return jobsApi.createJob({
          ...payload,
          status: formData.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiterJobs"] });
      queryClient.invalidateQueries({ queryKey: ["publicJobs"] });
      queryClient.invalidateQueries({ queryKey: ["public-jobs"] });
      navigate("/recruiter/jobs");
    },
    onError: (err: any) => {
      setFormError(
        err?.response?.data?.error || err.message || "Failed to save job.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Job title is required.");
      return;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      setFormError("Job description must be at least 20 characters.");
      return;
    }
    if (!formData.requirements.trim()) {
      setFormError("Job requirements are required.");
      return;
    }

    mutation.mutate();
  };

  if (isEditing && isLoadingJob) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading job specifications...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/recruiter/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Job Management
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isEditing ? "Edit Job Posting" : "Create New Job Opening"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Specify technical requirements, compensation, and department details
            for AI evaluation matching.
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" /> Basic Job
            Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Engineer (React + .NET)"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="">General Engineering (No Dept)</option>
                {departments.map((dept: Department) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. San Francisco, CA / Remote"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Employment Type
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employmentType: e.target.value as EmploymentType,
                  })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="PART_TIME">Part-time</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Experience Level
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceLevel: e.target.value as ExperienceLevel,
                  })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="ENTRY">Entry Level (0-2 yrs)</option>
                <option value="MID">Mid Level (2-5 yrs)</option>
                <option value="SENIOR">Senior Level (5-8 yrs)</option>
                <option value="LEAD">Lead / Principal (8+ yrs)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Compensation & Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Compensation &
            Lifecycle
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Minimum Annual Salary
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.salaryMin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salaryMin: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Maximum Annual Salary
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.salaryMax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salaryMax: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Currency
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.salaryCurrency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salaryCurrency: e.target.value.toUpperCase(),
                  })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicationDeadline: e.target.value,
                  })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Publishing Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as JobStatus,
                    })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="OPEN">Open (Published immediately)</option>
                  <option value="DRAFT">Draft (Save internally)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Description & Requirements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-purple-600" /> Detailed
            Specifications & Rubric
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Job Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe team mission, day-to-day responsibilities, and architecture scope..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Requirements & Technical Qualifications{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="• 5+ years building backend systems&#10;• Experience with React, TypeScript, C#, and PostgreSQL&#10;• Understanding of distributed state and CI/CD"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed font-mono text-xs"
              />
              <span className="text-[11px] text-slate-500">
                Tip: Use bullet points (•) for clean rendering and optimal AI
                parser token extraction.
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/recruiter/jobs"
            className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2.5 text-xs font-semibold text-white transition shadow-sm"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />{" "}
                {isEditing ? "Save Changes" : "Publish Job Opening"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
