import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sliders,
  RefreshCw,
  Save,
  Check,
  AlertCircle,
  Globe,
  Mail,
  Clock,
  UserPlus,
  Cpu,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/api/admin-settings-api";

export function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // Status message for feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // --- PLATFORM SETTINGS QUERY & MUTATION ---
  const {
    data: platformSettings = [],
    isLoading: isSettingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["admin-platform-settings"],
    queryFn: getPlatformSettings,
  });

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (platformSettings.length > 0) {
      const form: Record<string, string> = {};
      platformSettings.forEach((s) => {
        form[s.key] = s.value;
      });
      setSettingsForm(form);
    }
  }, [platformSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Record<string, string>) =>
      updatePlatformSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-platform-settings"] });
      showFeedback("success", "Platform settings saved successfully.");
    },
    onError: () => {
      showFeedback("error", "Failed to save platform settings.");
    },
  });

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure system parameters, recruitment operations, and global defaults. AI models and tokens are managed via environment variables (.env).
          </p>
        </div>

        {feedback && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            {feedback.message}
          </div>
        )}
      </div>

      {/* Main Settings Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    General Platform Operations
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Universal configuration defaults applied across candidate portals and operations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => refetchSettings()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {isSettingsLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl" />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                {/* Platform Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm["PlatformName"] ?? ""}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        PlatformName: e.target.value,
                      }))
                    }
                    placeholder="HireWise Recruitment Platform"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Brand name displayed in navigation bars, emails, and interview invitations.
                  </span>
                </div>

                {/* Support Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm["SupportEmail"] ?? ""}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        SupportEmail: e.target.value,
                      }))
                    }
                    placeholder="support@hirewise.dev"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Contact address linked in candidate error pages and system communications.
                  </span>
                </div>

                {/* Default Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Default Scheduling Timezone
                  </label>
                  <select
                    value={settingsForm["DefaultTimezone"] ?? "UTC"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        DefaultTimezone: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Colombo">Asia/Colombo (IST)</option>
                  </select>
                </div>

                {/* Max Applications */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Max Concurrent Applications Per Candidate
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settingsForm["MaxApplicationsPerCandidate"] ?? "10"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        MaxApplicationsPerCandidate: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Upper boundary on in-progress job applications allowed for a single applicant.
                  </span>
                </div>

                {/* Candidate Self Registration Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                      Candidate Self-Registration
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Permit prospective candidates to create self-service accounts without prior invite.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm["CandidateSelfRegistration"] === "true"}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          CandidateSelfRegistration: e.target.checked ? "true" : "false",
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* AI Guardrails Enforcement Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-blue-600" />
                      Enforce AI Validation Guardrails
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Validate structured agent responses against schema bounds and security heuristics.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm["EnableAiValidationGuardrails"] === "true"}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          EnableAiValidationGuardrails: e.target.checked ? "true" : "false",
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: AI Engine Configuration Info Card */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              AI Engine Configuration
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with standard 12-factor architecture, AI models, reasoning engines, and token limits are configured deterministically via environment variables.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-[11px] text-slate-500 block">GEMINI_MODEL</span>
                <span className="font-semibold text-slate-800 text-xs">gemini-2.5-flash / gemini-2.5-pro</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-[11px] text-slate-500 block">GEMINI_EMBEDDING_MODEL</span>
                <span className="font-semibold text-slate-800 text-xs">text-embedding-004</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-[11px] text-slate-500 block">PER-AGENT TUNING</span>
                <span className="font-semibold text-slate-800 text-xs">Temperatures & token limits tailored per agent in code</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              To customize foundation models, update your root <code className="text-slate-600 font-mono">.env</code> or Docker Compose environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
