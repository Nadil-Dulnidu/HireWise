import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  FileCheck,
  Cpu,
  RefreshCw,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getPlatformStats } from "@/lib/api/analytics-api";

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

export function AdminAnalyticsPage() {
  const {
    data: stats,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => getPlatformStats(),
  });

  // Format monthly signups and applications data for dual AreaChart
  const timeSeriesData = (stats?.monthlySignups ?? []).map((s, idx) => ({
    month: s.month,
    signups: s.count,
    applications: stats?.monthlyApplications?.[idx]?.count ?? 0,
  }));

  // Format Application statuses for BarChart
  const applicationStatusData = Object.entries(
    stats?.applicationsByStatus ?? {},
  ).map(([key, value]) => ({
    status: key,
    count: value,
  }));

  // Format AI Workflows for Donut
  const aiWorkflowData = Object.entries(stats?.aiWorkflowsByStatus ?? {}).map(
    ([key, value]) => ({
      name: key,
      value,
    }),
  );

  // Format Users by Role
  const usersByRoleData = Object.entries(stats?.usersByRole ?? {}).map(
    ([key, value]) => ({
      name: key,
      value,
    }),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Platform Analytics & Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry on candidate pipelines, agent execution health,
            and platform growth metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-indigo-600" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Total Registered Users
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? "—" : (stats?.totalUsers ?? 0)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              {stats?.usersByRole?.["CANDIDATE"] ?? 0} candidates
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Active Requisitions
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? "—" : (stats?.activeJobs ?? 0)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              out of {stats?.totalJobs ?? 0} total postings
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Applications Processed
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? "—" : (stats?.totalApplications ?? 0)}
            </h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              Across {stats?.totalCompanies ?? 0} companies
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        {/* AI Workflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Agentic AI Executions
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? "—" : (stats?.totalAiWorkflows ?? 0)}
            </h3>
            <p className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
              <Cpu className="h-3 w-3" />6 LangGraph Agents
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <Cpu className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trends (Signups & Applications) - Spans 2 Cols */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Pipeline & User Growth Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly candidate signups vs. job applications over the last 6
                months
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeSeriesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorSignups"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    name="User Registrations"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSignups)"
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Job Applications"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorApps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No activity records available for trending
              </div>
            )}
          </div>
        </div>

        {/* User Role Distribution (Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Role Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Platform breakdown across user classifications
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {usersByRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usersByRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {usersByRoleData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">
                No user role data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Industry Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Top Industries
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Primary domains represented in companies
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {(stats?.industryDistribution?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.industryDistribution ?? []}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    dataKey="industry"
                    type="category"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    width={85}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Organizations"
                    fill="#3b82f6"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No company industry data available
              </div>
            )}
          </div>
        </div>

        {/* Application Status Funnel Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              Application Stages
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate funnel by current status
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            {applicationStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={applicationStatusData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Applications"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No application data logged yet
              </div>
            )}
          </div>
        </div>

        {/* AI Workflow Statuses */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-600" />
              AI Agent Telemetry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Workflow execution states
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {aiWorkflowData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiWorkflowData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {aiWorkflowData.map((_, index) => (
                      <Cell
                        key={`wf-cell-${index}`}
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No workflow telemetry logged yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            Recent Administrative & Lifecycle Actions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stream from platform audit logs
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Triggered Role</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(stats?.recentActivities?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No recent audit events captured.
                  </td>
                </tr>
              ) : (
                stats?.recentActivities?.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">
                        {act.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {act.entityType}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {act.role || "SYSTEM"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
