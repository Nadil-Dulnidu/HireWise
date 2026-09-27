import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applications-api";
import { interviewsApi } from "@/lib/api/interviews-api";
import { availabilityApi } from "@/lib/api/availability-api";
import { aiApi } from "@/lib/api/ai-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInterviewers } from "@/lib/api/users-api";
import { apiClient } from "@/lib/api-client";
import {
  Calendar,
  Video,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Bot,
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

interface ScheduleInterviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  candidateName?: string;
  jobTitle?: string;
  candidateId?: string;
  aiWorkflowId?: string;
  onSuccess?: () => void;
}

function extractAiSchedulingRecommendation(workflowResponse: any): {
  recommended_slots: Array<{
    start_time: string;
    end_time: string;
    score?: number;
    interviewer_id?: string;
    candidate_id?: string;
    conflict_detected?: boolean;
  }>;
  reasoning?: string;
  conflicts?: string[];
} {
  if (!workflowResponse) return { recommended_slots: [] };
  const wf = workflowResponse.workflow || workflowResponse;

  // 1. Try from final_result / finalResult / FinalResultJson
  let finalResult = wf.final_result || wf.finalResult || wf.FinalResultJson;
  if (typeof finalResult === "string") {
    try {
      finalResult = JSON.parse(finalResult);
    } catch {}
  }

  let sched =
    finalResult?.scheduling_recommendation ||
    finalResult?.schedulingRecommendation ||
    finalResult?.scheduling ||
    finalResult?.SchedulingRecommendation;

  // 2. Fallback to steps array (Step 7: SCHEDULING)
  if (!sched || !sched.recommended_slots || sched.recommended_slots.length === 0) {
    const steps: any[] = wf.steps || wf.Steps || [];
    const schedStep = steps.find((s) => {
      const sName = (s.step_name || s.stepName || "").toUpperCase();
      const aName = (s.agent_name || s.agentName || "").toLowerCase();
      return (
        sName === "SCHEDULING" ||
        sName.includes("SCHEDUL") ||
        aName.includes("scheduling")
      );
    });

    if (schedStep) {
      let outputData = schedStep.output_data ?? schedStep.outputData ?? schedStep.OutputJson;
      if (typeof outputData === "string") {
        try {
          outputData = JSON.parse(outputData);
        } catch {}
      }
      if (outputData && (outputData.recommended_slots || outputData.reasoning)) {
        sched = outputData;
      }
    }
  }

  if (typeof sched === "string") {
    try {
      sched = JSON.parse(sched);
    } catch {}
  }

  if (sched && typeof sched === "object") {
    const slots = Array.isArray(sched.recommended_slots)
      ? sched.recommended_slots
      : Array.isArray(sched.recommendedSlots)
      ? sched.recommendedSlots
      : [];

    return {
      recommended_slots: slots,
      reasoning: sched.reasoning || sched.Reasoning || "",
      conflicts: Array.isArray(sched.conflicts) ? sched.conflicts : [],
    };
  }

  return { recommended_slots: [] };
}

export function ScheduleInterviewDialog({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  candidateId,
  aiWorkflowId,
  onSuccess,
}: ScheduleInterviewDialogProps) {
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();

  const [selectedAppId, setSelectedAppId] = useState<string>(applicationId || "");
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("14:00");
  const [endTime, setEndTime] = useState<string>("15:00");
  const [meetingLink, setMeetingLink] = useState<string>("https://meet.google.com/hwr-tech-rnd");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    if (applicationId) {
      setSelectedAppId(applicationId);
    }
  }, [applicationId]);

  // Fetch applications if not provided or to get candidate details
  const { data: appsData } = useQuery({
    queryKey: ["companyApplicationsForScheduling"],
    queryFn: () => applicationsApi.getCompanyApplications({ pageSize: 100 }),
    enabled: isOpen && !applicationId,
  });

  const applications = appsData?.items || [];
  const currentApp = useMemo(() => {
    if (applicationId) {
      return {
        id: applicationId,
        candidateName: candidateName || "Candidate",
        jobTitle: jobTitle || "Position",
        candidateId: candidateId || "",
        aiWorkflowId: aiWorkflowId,
      };
    }
    return applications.find((a) => a.id === selectedAppId);
  }, [applicationId, candidateName, jobTitle, candidateId, aiWorkflowId, applications, selectedAppId]);

  const activeCandidateId = currentApp?.candidateId || candidateId;
  const activeWorkflowId = aiWorkflowId || (currentApp as any)?.aiWorkflowId;

  // Fetch company interviewers
  const { data: interviewers = [], isLoading: interviewersLoading } = useQuery({
    queryKey: ["companyInterviewersForScheduling", profile?.companyId],
    queryFn: async () => {
      try {
        const interviewersList = await getInterviewers(profile?.companyId);
        if (interviewersList && interviewersList.length > 0) {
          return interviewersList;
        }
      } catch (err) {
        console.warn("Direct interviewers fetch fallback to /users:", err);
      }

      const res = await apiClient.get<ApiResponse<PagedResult<any>>>("/users", {
        params: { role: "INTERVIEWER", pageSize: 50 },
      });
      return res.data.data?.items || [];
    },
    enabled: isOpen,
  });

  // Automatically select the first interviewer if none selected
  useEffect(() => {
    if (interviewers.length > 0 && !selectedInterviewerId) {
      setSelectedInterviewerId(interviewers[0].id);
    }
  }, [interviewers, selectedInterviewerId]);

  // Fetch candidate availability
  const {
    data: candidateAvailability = [],
    isLoading: candidateAvailabilityLoading,
  } = useQuery({
    queryKey: ["candidateAvailabilityModal", activeCandidateId],
    queryFn: () => availabilityApi.getCandidateAvailability(activeCandidateId!),
    enabled: isOpen && !!activeCandidateId,
  });

  // Fetch interviewer availability
  const { data: interviewerAvailability = [] } = useQuery({
    queryKey: ["interviewerAvailabilityModal", selectedInterviewerId],
    queryFn: () => availabilityApi.getInterviewerAvailability(selectedInterviewerId),
    enabled: isOpen && !!selectedInterviewerId,
  });

  // Fetch AI Workflow for the selected application to extract AI Agent Recommended Slots
  const { data: appWorkflowData } = useQuery({
    queryKey: ["appAiWorkflowForScheduling", selectedAppId],
    queryFn: () => aiApi.getApplicationWorkflow(selectedAppId),
    enabled: isOpen && !!selectedAppId,
    retry: 1,
  });

  // Direct workflow fallback query if application workflow query fails or lacks workflow
  const effectiveWfId = activeWorkflowId || appWorkflowData?.workflow?.workflow_id;
  const { data: directWorkflow } = useQuery({
    queryKey: ["workflowDetailDirectScheduling", effectiveWfId],
    queryFn: () => aiApi.getWorkflowDetails(effectiveWfId!),
    enabled: isOpen && !!effectiveWfId && (!appWorkflowData || !appWorkflowData.workflow),
    retry: 1,
  });

  const effectiveWorkflow = appWorkflowData?.workflow
    ? appWorkflowData
    : directWorkflow
      ? { workflow: directWorkflow }
      : appWorkflowData;

  const {
    recommended_slots: aiRecommendedSlots,
    reasoning: aiReasoning,
  } = useMemo(() => {
    return extractAiSchedulingRecommendation(effectiveWorkflow);
  }, [effectiveWorkflow]);

  // Mutual slot overlap computation
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

  // Conflict warnings
  const isOutsideInterviewerAvailability = useMemo(() => {
    if (!startDate || !startTime || !endTime || interviewerAvailability.length === 0) {
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
  }, [startDate, startTime, endTime, interviewerAvailability]);

  const isOutsideCandidateAvailability = useMemo(() => {
    if (!startDate || !startTime || !endTime || candidateAvailability.length === 0) {
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
  }, [startDate, startTime, endTime, candidateAvailability]);

  const handleApplySlot = (slot: AvailabilitySlot) => {
    const sParts = (slot.startTime || "10:00").split(":");
    const eParts = (slot.endTime || "16:00").split(":");
    const sTime = `${sParts[0]}:${sParts[1]}`;

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
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToAdd)
      );
      setStartDate(nextDate.toISOString().split("T")[0]);
    }
  };

  const handleApplyAiSlot = (slot: any) => {
    const sDate = new Date(slot.start_time);
    const eDate = new Date(slot.end_time);

    // Format YYYY-MM-DD (in UTC)
    const yyyy = sDate.getUTCFullYear();
    const mm = String(sDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(sDate.getUTCDate()).padStart(2, "0");
    setStartDate(`${yyyy}-${mm}-${dd}`);

    // Format HH:mm (in UTC)
    const sH = String(sDate.getUTCHours()).padStart(2, "0");
    const sM = String(sDate.getUTCMinutes()).padStart(2, "0");
    const eH = String(eDate.getUTCHours()).padStart(2, "0");
    const eM = String(eDate.getUTCMinutes()).padStart(2, "0");

    setStartTime(`${sH}:${sM}`);
    setEndTime(`${eH}:${eM}`);

    if (slot.interviewer_id) {
      setSelectedInterviewerId(slot.interviewer_id);
    }
  };

  const createInterviewMutation = useMutation({
    mutationFn: (data: CreateInterviewRequest) => interviewsApi.createInterview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiterInterviews"] });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["recruiterApplicationDetail", selectedAppId] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to schedule interview."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const appIdToUse = applicationId || selectedAppId;
    if (!appIdToUse) {
      setErrorMsg("Please select an eligible candidate application.");
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
    if (!startTime || !endTime || startTime >= endTime) {
      setErrorMsg("Please specify a valid start and end time (End time must be after Start time).");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00Z`).toISOString();
    const endDateTime = new Date(`${startDate}T${endTime}:00Z`).toISOString();

    createInterviewMutation.mutate({
      applicationId: appIdToUse,
      interviewerId: selectedInterviewerId,
      scheduledStartTime: startDateTime,
      scheduledEndTime: endDateTime,
      meetingLink: meetingLink.trim(),
      notes: notes.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Dialog Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Schedule Technical Interview</h2>
          </div>
          <p className="text-xs text-slate-500">
            Set up an interview session matched with candidate and interviewer availability slots.
          </p>
        </div>

        {/* Candidate & Application Context */}
        {currentApp ? (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Selected Candidate
              </span>
              <h3 className="text-sm font-bold text-slate-900">{currentApp.candidateName}</h3>
              <p className="text-xs text-slate-600">Role: {currentApp.jobTitle}</p>
            </div>
            {candidateAvailability.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {candidateAvailability.length} availability slot(s) published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                No candidate slots submitted
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Choose Candidate Application</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select candidate application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.candidateName} — {app.jobTitle} ({app.status.replace(/_/g, " ")})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Candidate Availability Warning if empty */}
        {activeCandidateId && !candidateAvailabilityLoading && candidateAvailability.length === 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Candidate has not added availability slots yet</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                The candidate was sent an email notification prompting them to enter their availability. You may still manually specify a session time below if agreed offline.
              </p>
            </div>
          </div>
        )}

        {/* Interviewer Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Assigned Interviewer</span>
            {interviewers.length === 0 && !interviewersLoading && (
              <span className="text-[11px] font-normal text-red-500">No interviewers in your team</span>
            )}
          </label>
          <select
            value={selectedInterviewerId}
            onChange={(e) => setSelectedInterviewerId(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {interviewers.length === 0 ? (
              <option value="">No interviewers found</option>
            ) : (
              interviewers.map((inv: any) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name || `${inv.firstName || ""} ${inv.lastName || ""}`.trim() || inv.email} ({inv.email})
                </option>
              ))
            )}
          </select>
        </div>

        {/* AI Recommended Slots (from Interview Scheduling Agent 6) */}
        {aiRecommendedSlots.length > 0 ? (
          <div className="space-y-2.5 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-indigo-600" />
                <span>AI Recommended Slots ({aiRecommendedSlots.length} options)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                AI Scheduling Agent
              </span>
            </div>
            {aiReasoning && (
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                {aiReasoning}
              </p>
            )}
            <p className="text-[11px] text-indigo-800 font-medium">
              Click an AI optimized slot to autofill date, time, and interviewer:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {aiRecommendedSlots.slice(0, 6).map((slot: any, idx: number) => {
                const sDate = new Date(slot.start_time);
                const eDate = new Date(slot.end_time);
                const dateLabel = sDate.toLocaleDateString(undefined, {
                  timeZone: "UTC",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const sH = String(sDate.getUTCHours()).padStart(2, "0");
                const sM = String(sDate.getUTCMinutes()).padStart(2, "0");
                const eH = String(eDate.getUTCHours()).padStart(2, "0");
                const eM = String(eDate.getUTCMinutes()).padStart(2, "0");
                const timeLabel = `${sH}:${sM} - ${eH}:${eM} UTC`;
                const matchPct = Math.round((slot.score || 1.0) * 100);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyAiSlot(slot)}
                    className="px-3 py-2 rounded-xl bg-white border border-indigo-300 text-xs font-medium text-indigo-950 hover:bg-indigo-100/80 shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold">{dateLabel}: {timeLabel}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Score: {matchPct}% match</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Mutual Slot Suggestion / Quick Pickers (Fallback) */
          mutualSlots.length > 0 && (
            <div className="space-y-2 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Mutual Availability Slots ({mutualSlots.length} overlap found)</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Click a mutual slot to instantly populate the date and time:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {mutualSlots.slice(0, 4).map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleApplySlot(slot)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-medium text-emerald-800 hover:bg-emerald-100/60 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {slot.specificDate || getDayLabel(slot.dayOfWeek)}:{" "}
                      {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* Candidate Available Slots pill list */}
        {candidateAvailability.length > 0 && mutualSlots.length === 0 && (
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-indigo-600" /> Candidate Stated Availability
              </span>
              <span className="text-[11px] text-slate-500">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {candidateAvailability.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleApplySlot(slot)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  {slot.specificDate || getDayLabel(slot.dayOfWeek)}:{" "}
                  {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scheduling Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Interview Date</label>
              <input
                type="date"
                required
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Start Time (UTC)</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">End Time (UTC)</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Time Conflict Warnings */}
          {(isOutsideInterviewerAvailability || isOutsideCandidateAvailability) && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Scheduling Conflict Warning</span>
              </div>
              <ul className="text-[11px] list-disc list-inside space-y-0.5 text-amber-700">
                {isOutsideInterviewerAvailability && (
                  <li>Selected time falls outside the interviewer's published availability slots.</li>
                )}
                {isOutsideCandidateAvailability && (
                  <li>Selected time falls outside the candidate's submitted availability slots.</li>
                )}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Meeting Link</label>
            <div className="relative">
              <Video className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notes / Instructions (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please join 5 mins early with code editor ready..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInterviewMutation.isPending || interviewers.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition"
            >
              {createInterviewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scheduling Interview...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" /> Confirm & Schedule Interview
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
