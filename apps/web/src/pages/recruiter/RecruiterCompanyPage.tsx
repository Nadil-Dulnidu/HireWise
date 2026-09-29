import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi, departmentsApi } from "@/lib/api/jobs-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Building,
  Layers,
  Globe,
  Edit2,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

export function RecruiterCompanyPage() {
  // Get the current user's company and query client
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  const companyId = profile?.companyId;

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "",
    size: "",
    location: "",
    website: "",
    description: "",
    logoUrl: "",
  });

  // Department modal/creation state
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });

  // Fetch company
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => companiesApi.getCompanyById(companyId!),
    enabled: !!companyId,
  });

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["departments", companyId],
    queryFn: () => departmentsApi.getDepartments(companyId!),
    enabled: !!companyId,
  });

  // Populate company edit form when company data is loaded
  const startEditingCompany = () => {
    if (company) {
      setCompanyForm({
        name: company.name,
        industry: company.industry || "",
        size: company.size || "",
        location: company.location || "",
        website: company.website || "",
        description: company.description || "",
        logoUrl: company.logoUrl || "",
      });
      setIsEditingCompany(true);
    }
  };

  // Update Company Mutation
  const updateCompanyMutation = useMutation({
    mutationFn: () => companiesApi.updateCompany(companyId!, companyForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      setIsEditingCompany(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Failed to update company.");
    },
  });

  // Create Department Mutation
  const createDeptMutation = useMutation({
    mutationFn: () => departmentsApi.createDepartment(companyId!, deptForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", companyId] });
      setIsAddingDept(false);
      setDeptForm({ name: "", description: "" });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Failed to create department.");
    },
  });

  // Delete Department Mutation
  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", companyId] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || "Failed to delete department.");
    },
  });

  if (isLoadingCompany || isLoadingDepts) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading company profile...</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3 max-w-lg mx-auto">
        <Building className="h-10 w-10 text-blue-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          No Company Assigned
        </h2>
        <p className="text-xs text-slate-500">
          Your recruiter account is not yet assigned to an active company
          tenant. Please contact platform administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Company & Organization Workspace
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your organization profile, locations, brand overview, and
            internal engineering departments.
          </p>
        </div>

        {!isEditingCompany && (
          <button
            onClick={startEditingCompany}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm shrink-0"
          >
            <Edit2 className="h-4 w-4" /> Edit Company Profile
          </button>
        )}
      </div>

      {/* Section 1: Company Profile Info / Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {company?.name || "Company Profile"}
              </h2>
              <p className="text-xs text-slate-500">
                Multi-tenant Company ID: {companyId}
              </p>
            </div>
          </div>
        </div>

        {isEditingCompany ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateCompanyMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, name: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Industry
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Cloud Infrastructure"
                  value={companyForm.industry}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, industry: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Company Size
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50-100 employees, 500-1000"
                  value={companyForm.size}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, size: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Headquarters / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA / Remote"
                  value={companyForm.location}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, location: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={companyForm.website}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, website: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Company Overview
                </label>
                <textarea
                  rows={3}
                  value={companyForm.description}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingCompany(false)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-semibold text-white transition shadow-sm"
              >
                {updateCompanyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Company Details
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 md:col-span-2 text-sm text-slate-600 leading-relaxed">
              <p>
                {company?.description || "No company description provided."}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Industry</span>
                  <span className="text-slate-900 font-semibold mt-0.5 block">
                    {company?.industry || "Technology"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Company Size</span>
                  <span className="text-slate-900 font-semibold mt-0.5 block">
                    {company?.size || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Headquarters</span>
                  <span className="text-slate-900 font-semibold mt-0.5 block">
                    {company?.location || "Remote"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats panel */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tenant Metrics
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Total Employees</span>
                  <span className="font-bold text-slate-900">
                    {company?.employeeCount || 1}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Active Departments</span>
                  <span className="font-bold text-blue-600">
                    {departments.length}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Active Job Openings</span>
                  <span className="font-bold text-emerald-600">
                    {company?.activeJobCount || 0}
                  </span>
                </div>
              </div>

              {company?.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition shadow-xs"
                >
                  <Globe className="h-3.5 w-3.5 text-blue-600" /> Visit Public
                  Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Department Management */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Engineering & Product Departments
              </h2>
              <p className="text-xs text-slate-500">
                Organize job postings and interviewer assignments by business
                domain.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingDept(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Department
          </button>
        </div>

        {/* Add Department Form Inline */}
        {isAddingDept && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createDeptMutation.mutate();
            }}
            className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Create New Department
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Department Name (e.g. Applied AI Research)"
                value={deptForm.name}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, name: e.target.value })
                }
                className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="Description / Focus Area (Optional)"
                value={deptForm.description}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, description: e.target.value })
                }
                className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingDept(false)}
                className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createDeptMutation.isPending}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white transition shadow-sm"
              >
                {createDeptMutation.isPending
                  ? "Creating..."
                  : "Save Department"}
              </button>
            </div>
          </form>
        )}

        {/* Department List */}
        {departments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {dept.name}
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      {dept.activeJobCount} active jobs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {dept.description ||
                      "General domain and development scope."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Created {new Date(dept.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete department "${dept.name}"?`)) {
                        deleteDeptMutation.mutate(dept.id);
                      }
                    }}
                    className="p-1 text-rose-600 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                    title="Delete Department"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
            No specific departments created yet. All jobs will be filed under
            company root.
          </div>
        )}
      </div>
    </div>
  );
}
