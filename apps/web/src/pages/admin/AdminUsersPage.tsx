import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Briefcase,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  Ban,
} from "lucide-react";
import {
  getUsers,
  updateUserRole,
  deactivateUser,
  banUser,
  type UserFilterParams,
} from "@/lib/api/users-api";
import type { UserProfile, UserRole } from "@/types/auth";

export function AdminUsersPage() {
  const queryClient = useQueryClient();

  // State
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Ban Modal state
  const [banModalUser, setBanModalUser] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState("");

  // Role Change Confirmation Modal state
  const [roleModalUser, setRoleModalUser] = useState<{
    user: UserProfile;
    newRole: UserRole;
  } | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Users
  const filterParams: UserFilterParams = {
    page,
    pageSize,
    search: search || undefined,
    role: selectedRole || undefined,
    status: selectedStatus || undefined,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "admin-users",
      page,
      pageSize,
      search,
      selectedRole,
      selectedStatus,
    ],
    queryFn: () => getUsers(filterParams),
  });

  // Role Mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      setRoleModalUser(null);
    },
  });

  // Deactivate Mutation
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    },
  });

  // Ban Mutation
  const banMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      setBanModalUser(null);
      setBanReason("");
    },
  });

  // Role Badge Helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "RECRUITER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "INTERVIEWER":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CANDIDATE":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ONBOARDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "INACTIVE":
      default:
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  const handleRoleSelectChange = (user: UserProfile, newRole: UserRole) => {
    if (newRole === user.role) return;
    setRoleModalUser({ user, newRole });
  };

  const confirmRoleChange = () => {
    if (!roleModalUser) return;
    roleMutation.mutate({
      userId: roleModalUser.user.id,
      role: roleModalUser.newRole,
    });
  };

  const confirmBanUser = () => {
    if (!banModalUser) return;
    banMutation.mutate({ userId: banModalUser.id, reason: banReason });
  };

  const users = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage global platform accounts, assign elevated roles with Clerk
            synchronization, and enforce security policies.
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Total Registered
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {totalCount}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Clerk Synced</p>
            <h3 className="text-sm font-bold text-emerald-700 mt-1">
              Automatic Webhook & API
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Role Authority</p>
            <h3 className="text-sm font-bold text-purple-700 mt-1">
              Platform Admin Control
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Active Page Users
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {users.length}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or Clerk ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="INTERVIEWER">Interviewer</option>
            <option value="CANDIDATE">Candidate</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {(search || selectedRole || selectedStatus) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedRole("");
                setSelectedStatus("");
                setPage(1);
              }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role & Clerk Sync</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-slate-200 rounded" />
                          <div className="h-2.5 w-24 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-20 bg-slate-100 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-16 bg-slate-100 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-28 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 w-16 bg-slate-100 rounded inline-block" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">
                      No users found matching the criteria
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try refining your search terms or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.fullName || user.email}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {(
                              user.firstName?.[0] ||
                              user.email?.[0] ||
                              "U"
                            ).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">
                            {user.fullName?.trim() ||
                              `${user.firstName} ${user.lastName}`.trim() ||
                              "Nameless User"}
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <span>{user.email}</span>
                            <button
                              onClick={() => copyToClipboard(user.clerkUserId)}
                              title={`Clerk ID: ${user.clerkUserId}`}
                              className="text-slate-400 hover:text-slate-600 transition"
                            >
                              {copiedId === user.clerkUserId ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Role Dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleSelectChange(
                              user,
                              e.target.value as UserRole,
                            )
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition ${getRoleBadge(
                            user.role,
                          )}`}
                        >
                          <option value="CANDIDATE">CANDIDATE</option>
                          <option value="INTERVIEWER">INTERVIEWER</option>
                          <option value="RECRUITER">RECRUITER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(
                          user.status,
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {user.companyName || "—"}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.status === "ACTIVE" ? (
                          <button
                            onClick={() => deactivateMutation.mutate(user.id)}
                            disabled={deactivateMutation.isPending}
                            title="Deactivate Account"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            setBanModalUser(user);
                            setBanReason("");
                          }}
                          title="Ban Account"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Showing page{" "}
              <span className="font-semibold text-slate-800">{page}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalPages}</span>{" "}
              ({totalCount} users)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Confirm Role Update & Clerk Sync
                </h3>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to change the platform role for{" "}
                <span className="font-semibold text-slate-900">
                  {roleModalUser.user.fullName || roleModalUser.user.email}
                </span>{" "}
                from{" "}
                <span className="font-bold text-slate-800">
                  {roleModalUser.user.role}
                </span>{" "}
                to{" "}
                <span className="font-bold text-indigo-600">
                  {roleModalUser.newRole}
                </span>
                .
              </p>

              {roleModalUser.newRole === "ADMIN" && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex gap-2.5 text-xs text-purple-800">
                  <AlertTriangle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      Elevation to Platform Administrator:
                    </span>{" "}
                    This grants full system permissions across candidate
                    databases, company settings, and platform configurations.
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  This change is automatically synchronized to Clerk user{" "}
                  <code className="font-mono text-[11px] bg-blue-100/70 px-1 py-0.5 rounded">
                    publicMetadata.role
                  </code>{" "}
                  via the Clerk REST Backend API.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                disabled={roleMutation.isPending}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {roleMutation.isPending
                  ? "Syncing with Clerk..."
                  : "Confirm Role Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Ban User Account
                </h3>
              </div>
              <button
                onClick={() => setBanModalUser(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Are you sure you want to ban{" "}
                <span className="font-semibold text-slate-900">
                  {banModalUser.email}
                </span>
                ? This will revoke active sessions and set status to{" "}
                <span className="font-bold text-rose-600">INACTIVE</span>.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Ban
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Terms of service violation, fraudulent applications..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setBanModalUser(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmBanUser}
                disabled={banMutation.isPending}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
              >
                {banMutation.isPending ? "Banning..." : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
