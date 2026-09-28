import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse, UserProfile } from "@/types/auth";
import { Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Candidate profile page for editing personal contact details
export function CandidateProfilePage() {
  const { profile, refetchProfile } = useCurrentUser();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate form inputs when current user profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Mutation to update candidate profile information via API
  const updateMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      const response = await apiClient.put<ApiResponse<UserProfile>>(
        "/users/me",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      setErrorMessage(null);
      setSuccessMessage("Profile updated successfully!");
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setSuccessMessage(null);
      setErrorMessage(
        err?.response?.data?.error || err.message || "Failed to update profile",
      );
    },
  });

  // Validate form inputs and submit profile changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("First name and last name are required.");
      return;
    }
    setErrorMessage(null);
    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Candidate Profile
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your contact information and personal details shared with
          hiring teams.
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 text-xl font-bold">
            {profile?.firstName?.[0] || "C"}
            {profile?.lastName?.[0] || "P"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {profile?.fullName || "Candidate"}
            </h3>
            <p className="text-xs text-slate-500">{profile?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Role: {profile?.role || "CANDIDATE"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Nadil"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Silva"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Email Address (Managed by Clerk)
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              disabled
              value={profile?.email || ""}
              className="w-full rounded-xl bg-slate-100 border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Email is synchronized with your identity provider.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Phone Number
          </label>
          <div className="relative flex items-center">
            <Phone className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
