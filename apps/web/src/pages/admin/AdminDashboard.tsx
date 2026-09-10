import {
  Building2,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { auditLogsApi } from "@/lib/api/audit-logs-api";
import { companiesApi } from "@/lib/api/jobs-api";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PagedResult } from "@/types/auth";

export function AdminDashboard() {
  const { data: auditData } = useQuery({
    queryKey: ["recent-audit-logs"],
    queryFn: () => auditLogsApi.getAuditLogs({ page: 1, pageSize: 5 }),
  });

  const { data: companiesData, isLoading: isCompaniesLoading } = useQuery({
    queryKey: ["admin-companies-count"],
    queryFn: () => companiesApi.getCompanies({ pageSize: 1 }),
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResult<any>>>("/users", {
        params: { pageSize: 1 },
      });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Platform Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Root Access • Manage company tenants, approve recruiter roles, and
            audit security events.
          </p>
        </div>

        <Link
          to="/admin/audit-logs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-800 transition shadow-sm"
        >
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          View Complete Audit Trail
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* System KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Security Status",
            value: "Hardened",
            icon: ShieldCheck,
            color: "text-emerald-700",
            bg: "bg-emerald-50 border border-emerald-200",
          },
          {
            label: "Active Companies",
            value: isCompaniesLoading
              ? "..."
              : (companiesData?.totalCount ?? 0).toString(),
            icon: Building2,
            color: "text-blue-700",
            bg: "bg-blue-50 border border-blue-200",
          },
          {
            label: "Total Platform Users",
            value: isUsersLoading
              ? "..."
              : (usersData?.totalCount ?? 0).toString(),
            icon: UserCheck,
            color: "text-indigo-700",
            bg: "bg-indigo-50 border border-indigo-200",
          },
          {
            label: "Total Audit Records",
            value:
              auditData?.totalCount !== undefined
                ? auditData.totalCount.toString()
                : "0",
            icon: ShieldAlert,
            color: "text-amber-700",
            bg: "bg-amber-50 border border-amber-200",
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
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
          </div>
        ))}
      </div>

      {/* Recent Audit Events Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" /> Recent Security &
            Audit Logs
          </h3>
          <Link
            to="/admin/audit-logs"
            className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
          >
            View All Events <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {auditData?.items?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              No audit events recorded yet.
            </p>
          ) : (
            auditData?.items?.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      log.action === "CREATE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : log.action === "UPDATE"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {log.entityType}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    ({log.entityId.substring(0, 8)}...)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>{log.userName || log.userEmail || "System"}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
