import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Search,
  RefreshCw,
  Briefcase,
  Users,
  Layers,
  Globe,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
} from "lucide-react";
import {
  getCompanies,
  type Company,
  type CompanyFilterParams,
} from "@/lib/api/companies-api";

export function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [inspectCompany, setInspectCompany] = useState<Company | null>(null);

  const filterParams: CompanyFilterParams = {
    page,
    pageSize,
    search: search || undefined,
    industry: selectedIndustry || undefined,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-companies", page, pageSize, search, selectedIndustry],
    queryFn: () => getCompanies(filterParams),
  });

  const companies = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Aggregated quick stats from current items
  const totalActiveJobs = companies.reduce(
    (acc, c) => acc + (c.activeJobCount || 0),
    0,
  );
  const totalEmployees = companies.reduce(
    (acc, c) => acc + (c.employeeCount || 0),
    0,
  );

  // Unique industries for filter dropdown
  const industries = [
    "Cloud Infrastructure",
    "Artificial Intelligence",
    "Financial Technology",
    "Enterprise Software",
    "Healthcare Tech",
    "Cybersecurity",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-blue-600" />
            Company Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise organizations, hiring departments, and active
            requisitions across the recruitment network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
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
              Total Companies
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {totalCount}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Active Job Openings
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {totalActiveJobs}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Associated Employees
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {totalEmployees}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Org Management</p>
            <h3 className="text-sm font-bold text-amber-700 mt-1">
              Clerk Multi-Tenant Sync
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, slug, or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => {
              setSelectedIndustry(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition cursor-pointer"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          {(search || selectedIndustry) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedIndustry("");
                setPage(1);
              }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Industry</th>
                <th className="py-3.5 px-4">Scale & Location</th>
                <th className="py-3.5 px-4">Active Jobs</th>
                <th className="py-3.5 px-4">Employees</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-slate-200 rounded" />
                          <div className="h-2.5 w-24 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-24 bg-slate-100 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-28 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-12 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-12 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 w-14 bg-slate-100 rounded inline-block" />
                    </td>
                  </tr>
                ))
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">
                      No companies found matching criteria
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try refining search parameters or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                companies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition">
                    {/* Organization Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="h-9 w-9 rounded-xl object-contain border border-slate-200 bg-white p-1"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {comp.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-1.5">
                            <span>{comp.name}</span>
                            {comp.website && (
                              <a
                                href={
                                  comp.website.startsWith("http")
                                    ? comp.website
                                    : `https://${comp.website}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-blue-600 transition"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            /
                            {comp.slug ||
                              comp.name.toLowerCase().replace(/\s+/g, "-")}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Industry */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {comp.industry || "General Tech"}
                      </span>
                    </td>

                    {/* Scale & Location */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{comp.location || "Remote"}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Size: {comp.size || "Unspecified"}
                      </div>
                    </td>

                    {/* Active Jobs */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Briefcase className="h-3 w-3" />
                        {comp.activeJobCount}
                      </span>
                    </td>

                    {/* Employees */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {comp.employeeCount} members
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectCompany(comp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        View
                      </button>
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
              ({totalCount} companies)
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

      {/* Inspect Company Drawer / Modal */}
      {inspectCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {inspectCompany.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {inspectCompany.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectCompany.industry || "Technology"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectCompany(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {inspectCompany.description && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">
                    Company Overview
                  </h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {inspectCompany.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium block">
                    Headquarters
                  </span>
                  <span className="text-slate-800 font-semibold mt-0.5 block flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {inspectCompany.location || "Remote"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium block">
                    Company Scale
                  </span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {inspectCompany.size || "10-50"} employees
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium block">
                    Active Technical Jobs
                  </span>
                  <span className="text-emerald-700 font-bold mt-0.5 block flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {inspectCompany.activeJobCount} open
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium block">
                    Departments
                  </span>
                  <span className="text-indigo-700 font-bold mt-0.5 block">
                    {inspectCompany.departmentCount} functional units
                  </span>
                </div>
              </div>

              {/* Technical / Organization Identifiers */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Clerk Organization ID:</span>
                  <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {inspectCompany.clerkOrganizationId || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Website:</span>
                  {inspectCompany.website ? (
                    <a
                      href={
                        inspectCompany.website.startsWith("http")
                          ? inspectCompany.website
                          : `https://${inspectCompany.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      {inspectCompany.website}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Created At:</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {new Date(inspectCompany.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectCompany(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
