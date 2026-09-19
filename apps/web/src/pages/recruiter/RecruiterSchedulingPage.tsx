import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { applicationsApi } from "@/lib/api/applications-api";
import { interviewsApi } from "@/lib/api/interviews-api";
import { availabilityApi } from "@/lib/api/availability-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInterviewers } from "@/lib/api/users-api";
import {
  Calendar,
  Clock,
  Video,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Plus,
  UserPlus,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import type { ApiResponse, PagedResult } from "@/types/auth";
import {
  type CreateInterviewRequest,
  type AvailabilitySlot,
  getDayLabel,
  formatTimeDisplay,
  normalizeDayOfWeek,
} from "@/types/interviews";

export function RecruiterSchedulingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();

  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedInterviewerId, setSelectedInterviewerId] =
    useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("14:00");
  const [endTime, setEndTime] = useState<string>("15:00");
  const [meetingLink, setMeetingLink] = useState<string>(
    "https://meet.google.com/hwr-tech-rnd",
  );
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch eligible applications (INTERVIEW_APPROVED or all company applications)
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ["approvedApplications"],
    queryFn: () => applicationsApi.getCompanyApplications({ pageSize: 50 }),
  });

  // Fetch company interviewers
  const { data: interviewersData = [], isLoading: interviewersLoading } =
    useQuery({
      queryKey: ["companyInterviewers", profile?.companyId],
      queryFn: async () => {
        try {
          const interviewersList = await getInterviewers(profile?.companyId);
          if (interviewersList && interviewersList.length > 0) {
            return interviewersList;
          }
        } catch (err) {
          console.warn("Direct interviewers fetch fallback to /users:", err);
        }

        const res = await apiClient.get<ApiResponse<PagedResult<any>>>(
          "/users",
          {
            params: { role: "INTERVIEWER", pageSize: 50 },
          },
        );
        return res.data.data?.items || [];
      },
    });

  const applications = appsData?.items || [];
  const interviewers = interviewersData || [];

  // Filter applications that are eligible for scheduling
  const eligibleApps = applications.filter((a) => {
    return (
      a.status === "INTERVIEW_APPROVED" ||
      a.status === "AI_RECOMMENDED" ||
      a.status === "RECRUITER_REVIEW"
    );
  });

  const selectedApp = applications.find((a) => a.id === selectedAppId);
  const selectedCandidateId = selectedApp?.candidateId;
  const selectedInterviewer = interviewers.find(
    (u: any) => u.id === selectedInterviewerId,
  );

  // Fetch candidate availability
  const {
    data: candidateAvailability = [],
    isLoading: candidateAvailabilityLoading,
  } = useQuery({
    queryKey: ["candidateAvailability", selectedCandidateId],
    queryFn: () =>
      availabilityApi.getCandidateAvailability(selectedCandidateId!),
    enabled: !!selectedCandidateId,
  });

  // Fetch selected interviewer availability
  const {
    data: interviewerAvailability = [],
    isLoading: interviewerAvailabilityLoading,
  } = useQuery({
    queryKey: ["interviewerAvailability", selectedInterviewerId],
    queryFn: () =>
      availabilityApi.getInterviewerAvailability(selectedInterviewerId),
    enabled: !!selectedInterviewerId,
  });

  // Calculate mutual overlapping availability slots between candidate and interviewer
  const mutualSlots = useMemo(() => {
    if (!candidateAvailability.length || !interviewerAvailability.length) {
      return [];
    }

    const parseMin = (t: string) => {
      if (!t) return 0;
      const parts = t.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
    };

    const formatMin = (m: number) => {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
    };

    const overlaps: Array<AvailabilitySlot & { isMutual?: boolean }> = [];

    for (const cSlot of candidateAvailability) {
      for (const iSlot of interviewerAvailability) {
        const cDay = normalizeDayOfWeek(cSlot.dayOfWeek);
        const iDay = normalizeDayOfWeek(iSlot.dayOfWeek);
        const sameDay = cDay !== -1 && cDay === iDay;
        const sameDate =
          cSlot.specificDate &&
          iSlot.specificDate &&
          cSlot.specificDate === iSlot.specificDate;

        if (sameDay || sameDate) {
          const cStart = parseMin(cSlot.startTime);
          const cEnd = parseMin(cSlot.endTime);
          const iStart = parseMin(iSlot.startTime);
          const iEnd = parseMin(iSlot.endTime);

          const overlapStart = Math.max(cStart, iStart);
          const overlapEnd = Math.min(cEnd, iEnd);

          // Overlap window must be at least 30 minutes
          if (overlapEnd - overlapStart >= 30) {
            overlaps.push({
              id: `mutual-${cSlot.id}-${iSlot.id}`,
              userId: "mutual",
              userName: "Mutual Overlap",
              dayOfWeek: cDay,
              startTime: formatMin(overlapStart),
              endTime: formatMin(overlapEnd),
              timezone: iSlot.timezone || cSlot.timezone || "UTC",
              isRecurring: cSlot.isRecurring && iSlot.isRecurring,
              specificDate: cSlot.specificDate || iSlot.specificDate,
              createdAt: new Date().toISOString(),
              isMutual: true,
            });
          }
        }
      }
    }
    return overlaps;
  }, [candidateAvailability, interviewerAvailability]);

  // Check if selected time falls outside the interviewer's configured slots
  const isOutsideInterviewerAvailability = (() => {
    if (
      !startDate ||
      !startTime ||
      !endTime ||
      interviewerAvailability.length === 0
    ) {
      return false;
    }

    const chosenDate = new Date(`${startDate}T${startTime}:00Z`);
    const chosenDayOfWeek = chosenDate.getUTCDay();
    const reqStart = `${startTime}:00`;
    const reqEnd = `${endTime}:00`;

    const isMatch = interviewerAvailability.some((slot) => {
      if (slot.specificDate) {
        return (
          slot.specificDate === startDate &&
          slot.startTime <= reqStart &&
          slot.endTime >= reqEnd
        );
      }
      return (
        normalizeDayOfWeek(slot.dayOfWeek) === chosenDayOfWeek &&
        slot.startTime <= reqStart &&
        slot.endTime >= reqEnd
      );
    });

    return !isMatch;
  })();

  // Check if selected time falls outside the candidate's configured slots
  const isOutsideCandidateAvailability = (() => {
    if (
      !startDate ||
      !startTime ||
      !endTime ||
      candidateAvailability.length === 0
    ) {
      return false;
    }

    const chosenDate = new Date(`${startDate}T${startTime}:00Z`);
    const chosenDayOfWeek = chosenDate.getUTCDay();
    const reqStart = `${startTime}:00`;
    const reqEnd = `${endTime}:00`;

    const isMatch = candidateAvailability.some((slot) => {
      if (slot.specificDate) {
        return (
          slot.specificDate === startDate &&
          slot.startTime <= reqStart &&
          slot.endTime >= reqEnd
        );
      }
      return (
        normalizeDayOfWeek(slot.dayOfWeek) === chosenDayOfWeek &&
        slot.startTime <= reqStart &&
        slot.endTime >= reqEnd
      );
    });

    return !isMatch;
  })();

  const handleApplySlot = (slot: AvailabilitySlot) => {
    const sParts = (slot.startTime || "10:00").split(":");
    const eParts = (slot.endTime || "16:00").split(":");
    const sTime = `${sParts[0]}:${sParts[1]}`;

    // Set 1-hour session by default within slot range
    const startH = parseInt(sParts[0], 10);
    const endH = parseInt(eParts[0], 10);
    let eTime = `${String(Math.min(startH + 1, endH)).padStart(2, "0")}:${sParts[1]}`;
    if (sTime >= eTime) {
      eTime = `${eParts[0]}:${eParts[1]}`;
    }

    setStartTime(sTime);
    setEndTime(eTime);

    if (slot.specificDate) {
      setStartDate(slot.specificDate);
    } else {
      const targetDay = normalizeDayOfWeek(slot.dayOfWeek);
      const now = new Date();
      let daysToAdd = (targetDay - now.getUTCDay() + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      const nextDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + daysToAdd,
        ),
      );
      setStartDate(nextDate.toISOString().split("T")[0]);
    }
  };

  const createInterviewMutation = useMutation({
    mutationFn: (data: CreateInterviewRequest) =>
      interviewsApi.createInterview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiterInterviews"] });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      navigate("/recruiter/interviews");
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to schedule interview.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      setErrorMsg("Please select an eligible candidate application.");
      return;
    }

    const targetApp = applications.find((a) => a.id === selectedAppId);
    if (
      targetApp &&
      (targetApp.status === "INTERVIEW_SCHEDULED" ||
        targetApp.status === "INTERVIEW_COMPLETED" ||
        targetApp.status === "SELECTED" ||
        targetApp.status === "REJECTED")
    ) {
      setErrorMsg(
        `Applicant ${targetApp.candidateName} is already in '${targetApp.status.replace(/_/g, " ")}' status and cannot be scheduled again.`,
      );
      return;
    }

    if (!selectedInterviewerId) {
      setErrorMsg("Please select an interviewer from your company.");
      return;
    }
    if (!startDate) {
      setErrorMsg("Please select a date.");
      return;
    }

    const startDateTime = new Date(
      `${startDate}T${startTime}:00Z`,
    ).toISOString();
    const endDateTime = new Date(`${startDate}T${endTime}:00Z`).toISOString();

    createInterviewMutation.mutate({
      applicationId: selectedAppId,
      interviewerId: selectedInterviewerId,
      scheduledStartTime: startDateTime,
      scheduledEndTime: endDateTime,
      meetingLink: meetingLink.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <Link
        to="/recruiter/interviews"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Interviews
      </Link>

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Calendar className="h-7 w-7 text-indigo-600" /> Schedule Technical
          Interview
        </h1>
        <p className="text-sm text-slate-500">
          Match an approved candidate with an assigned technical evaluator,
          cross-check their availability side-by-side, find mutual open windows, and dispatch calendar invites.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* 2-Column: Form & Live Availability Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">
              Interview Configuration
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Application Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Candidate Application
                </label>
                {appsLoading ? (
                  <div className="p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />{" "}
                    Loading applications...
                  </div>
                ) : (
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    required
                  >
                    <option value="">
                      -- Select an Approved Application --
                    </option>
                    {eligibleApps.length === 0 ? (
                      <option value="" disabled>
                        No candidates currently pending interview scheduling
                      </option>
                    ) : (
                      eligibleApps.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.candidateName} — {app.jobTitle} (
                          {app.status.replace(/_/g, " ")})
                        </option>
                      ))
                    )}
                  </select>
                )}
                {eligibleApps.length === 0 && !appsLoading && (
                  <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> All approved candidates
                    have already been scheduled for interviews.
                  </p>
                )}
              </div>

              {/* Interviewer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Assigned Interviewer
                  </label>
                  <Link
                    to="/recruiter/team"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-medium"
                  >
                    <UserPlus className="h-3 w-3" /> Manage Staff
                  </Link>
                </div>
                {interviewersLoading ? (
                  <div className="p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />{" "}
                    Loading interviewers...
                  </div>
                ) : interviewers.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                    <span>
                      No active interviewers assigned to your organization yet.
                    </span>
                    <Link
                      to="/recruiter/team"
                      className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 text-[11px] font-medium transition"
                    >
                      Invite Interviewer
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedInterviewerId}
                    onChange={(e) => setSelectedInterviewerId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    required
                  >
                    <option value="">
                      -- Select Company Interviewer ({interviewers.length}{" "}
                      available) --
                    </option>
                    {interviewers.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || `${user.firstName} ${user.lastName}`}{" "}
                        ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Start Time (UTC)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    End Time (UTC)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Availability Warnings */}
              {isOutsideInterviewerAvailability && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">
                      Outside Interviewer's Published Hours
                    </span>
                    <span className="text-[11px] text-amber-700">
                      The selected window ({startTime} – {endTime} UTC on {startDate}) does not align with the interviewer's scheduled slots.
                    </span>
                  </div>
                </div>
              )}

              {isOutsideCandidateAvailability && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">
                      Outside Candidate's Stated Availability
                    </span>
                    <span className="text-[11px] text-sky-700">
                      The selected window ({startTime} – {endTime} UTC on {startDate}) does not match the candidate's preferred availability slots.
                    </span>
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Video Conference URL
                </label>
                <div className="relative">
                  <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Preparation Instructions & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Focus on backend system design and concurrency handling..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={createInterviewMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm mt-2 cursor-pointer"
              >
                {createInterviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Confirm & Dispatch Schedule
              </button>
            </form>
          </div>
        </div>

        {/* Live Availability Comparison Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Mutual Availability Overlap Panel */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50/40 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Mutual Availability Overlap
              </h3>
              {mutualSlots.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[11px] font-semibold">
                  {mutualSlots.length} Match{mutualSlots.length > 1 ? "es" : ""}
                </span>
              )}
            </div>

            {!selectedAppId || !selectedInterviewerId ? (
              <p className="text-xs text-emerald-700/80">
                Select both a candidate application and an interviewer on the left to compute overlapping time windows automatically.
              </p>
            ) : candidateAvailabilityLoading || interviewerAvailabilityLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin mx-auto" />
              </div>
            ) : mutualSlots.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-white/80 border border-emerald-200/80 text-xs text-emerald-800 space-y-1">
                <p className="font-semibold">No direct slot overlaps found</p>
                <p className="text-[11px] text-emerald-700">
                  The candidate and interviewer do not share common recurring availability hours. You can still pick from individual schedules below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-emerald-800 font-medium">
                  Ideal meeting times where both parties are confirmed available:
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {mutualSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between hover:border-emerald-400 hover:shadow-xs transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-xs text-emerald-950">
                            {getDayLabel(slot.dayOfWeek, false)}
                          </div>
                          <div className="text-[11px] text-slate-700">
                            {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({slot.timezone})
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplySlot(slot)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition cursor-pointer shadow-xs"
                      >
                        Apply Slot
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Candidate Availability Slots */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-blue-600" /> Candidate Availability
              </h3>
              {selectedApp && (
                <span className="text-xs text-blue-700 font-medium truncate max-w-[200px]">
                  {selectedApp.candidateName}
                </span>
              )}
            </div>

            {!selectedAppId ? (
              <div className="p-5 text-center text-xs text-slate-400 space-y-1">
                <User className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                <p>Select a candidate application to view their availability schedule.</p>
              </div>
            ) : candidateAvailabilityLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin mx-auto" />
              </div>
            ) : candidateAvailability.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 space-y-1 bg-slate-50 rounded-xl border border-slate-200">
                <AlertCircle className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">No candidate slots registered</p>
                <p className="text-[11px] text-slate-400">
                  This candidate has not configured specific preferred time slots.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {candidateAvailability.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between hover:border-blue-300 transition group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-blue-900">
                        {getDayLabel(slot.dayOfWeek, false)}
                      </div>
                      <div className="text-slate-700 font-medium text-[11px] mt-0.5">
                        {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({slot.timezone})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySlot(slot)}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 group-hover:bg-blue-600 text-blue-800 group-hover:text-white border border-blue-200 text-[11px] font-medium transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interviewer Availability Slots */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" /> Interviewer Availability
              </h3>
              {selectedInterviewer && (
                <span className="text-xs text-indigo-700 font-medium truncate max-w-[200px]">
                  {selectedInterviewer.fullName || selectedInterviewer.firstName || selectedInterviewer.email}
                </span>
              )}
            </div>

            {!selectedInterviewerId ? (
              <div className="p-5 text-center text-xs text-slate-400 space-y-1">
                <Clock className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                <p>Select an interviewer to view their recurring weekly slots.</p>
              </div>
            ) : interviewerAvailabilityLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 text-indigo-600 animate-spin mx-auto" />
              </div>
            ) : interviewerAvailability.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 space-y-1 bg-slate-50 rounded-xl border border-slate-200">
                <AlertCircle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="font-semibold text-slate-800">No custom slots published</p>
                <p className="text-[11px] text-slate-500">
                  This interviewer has not yet configured specific availability slots.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {interviewerAvailability.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-indigo-700">
                        {getDayLabel(slot.dayOfWeek, false)}
                      </div>
                      <div className="text-slate-800 font-medium text-[11px] mt-0.5">
                        {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          ({slot.timezone})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySlot(slot)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white border border-indigo-200 text-[11px] font-medium transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

