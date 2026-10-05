import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { jobsApi, companiesApi } from "@/lib/api/jobs-api";
import { applicationsApi } from "@/lib/api/applications-api";
import {
  Briefcase,
  Bot,
  Activity,
  Plus,
  Building,
  ArrowRight,
  Loader2,
} from "lucide-react";

export function RecruiterDashboard() {
  const { profile } = useCurrentUser();
  const companyId = profile?.companyId;

  const { data: jobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ["recruiterJobsCount"],
    queryFn: () => jobsApi.getRecruiterJobs({ pageSize: 100 }),
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => companiesApi.getCompanyById(companyId!),
    enabled: !!companyId,
  });

  const { data: appsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ["recruiterDashboardApplications", companyId],
    queryFn: () => applicationsApi.getCompanyApplications({ pageSize: 50 }),
    enabled: !!companyId,
  });

  const allApplications = appsData?.items || [];
  const evaluationsReadyCount = allApplications.filter(
    (a) => a.status === "AI_RECOMMENDED" || a.status === "AI_REVIEW",
  ).length;
  const pendingApprovalsCount = allApplications.filter(
    (a) => a.status === "RECRUITER_REVIEW" || a.status === "INTERVIEW_APPROVED",
  ).length;
  const activeWorkflowsCount = allApplications.filter(
    (a) => a.status === "AI_REVIEW",
  ).length;
  const pendingAiRecommendations = allApplications.filter(
    (a) => a.status === "AI_RECOMMENDED" || a.status === "AI_REVIEW",
  );

  const activeJobsCount =
    jobsData?.items?.filter((j) => j.status === "OPEN").length ?? 0;
  const totalJobsCount = jobsData?.totalCount ?? 0;

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Recruiter Workspace
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Company:{" "}
            <Link
              to="/recruiter/companies"
              className="text-blue-600 font-semibold hover:underline"
            >
              {company?.name || profile?.companyName || "HireWise Organization"}
            </Link>{" "}
            • Role: Recruiter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Post New Job
          </Link>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {[
          {
            label: "Active Job Openings",
            value: isJobsLoading ? "..." : activeJobsCount.toString(),
            icon: Briefcase,
            color: "text-blue-600",
            bg: "bg-blue-50 border border-blue-100",
            link: "/recruiter/jobs",
          },
          {
            label: "Total Postings",
            value: isJobsLoading ? "..." : totalJobsCount.toString(),
            icon: Building,
            color: "text-blue-600",
            bg: "bg-blue-50 border border-blue-100",
            link: "/recruiter/jobs",
          },
          {
            label: "AI Evaluations Ready",
            value: isAppsLoading ? "..." : evaluationsReadyCount.toString(),
            icon: Bot,
            color: "text-blue-600",
            bg: "bg-blue-50 border border-blue-100",
            link: "/recruiter/applications",
          },
          {
            label: "Pending Approvals",
            value: isAppsLoading ? "..." : pendingApprovalsCount.toString(),
            icon: Activity,
            color: "text-amber-600",
            bg: "bg-amber-50 border border-amber-100",
            link: "/recruiter/applications",
          },
        ].map((kpi, i) => (
          <Link
            key={i}
            to={kpi.link}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 hover:shadow transition-all"
          >
            <div>
              <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {kpi.value}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main Sections: Action Needed & AI Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Pending Recruiter Approvals */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" /> Pending AI Hiring
              Recommendations
            </h3>
            <Link
              to="/recruiter/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Review Queue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isAppsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
            </div>
          ) : pendingAiRecommendations.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <Bot className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-700 font-medium">
                No pending AI evaluations awaiting review.
              </p>
              <p className="text-xs text-slate-500">
                When candidates submit applications to your open roles, AI
                multi-agent evaluations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAiRecommendations.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {item.candidateName}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.jobTitle} • Applied{" "}
                      {new Date(item.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/recruiter/applications/${item.id}`}
                      className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-slate-50 transition shadow-xs"
                    >
                      View Evaluation
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Links & Monitoring */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" /> AI Workflow Monitor
          </h3>
          <p className="text-xs text-slate-600">
            Real-time telemetry of LangGraph agents executing resume parsing,
            rubric scoring, and schedule optimization.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-semibold">
                Active Workflows
              </span>
              <span
                className={
                  activeWorkflowsCount > 0
                    ? "text-emerald-700 font-bold"
                    : "text-slate-500 font-medium"
                }
              >
                {activeWorkflowsCount > 0
                  ? `${activeWorkflowsCount} Running`
                  : "Idle / Ready"}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${activeWorkflowsCount > 0 ? "bg-blue-600 w-2/3 animate-pulse" : "bg-slate-300 w-full"}`}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">
              {activeWorkflowsCount > 0
                ? "Agent Step: Orchestrating evaluation pipeline"
                : "System standby • 6 recruitment agents ready"}
            </span>
          </div>

          <Link
            to="/recruiter/ai-workflows"
            className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 transition"
          >
            Open Workflow Inspector
          </Link>
        </div>
      </div>
    </div>
  );
}
