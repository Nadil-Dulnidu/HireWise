import { useState, useEffect, useCallback } from "react";
import { useSignalR } from "./useSignalR";
import type { SignalRNotificationPayload } from "./useSignalR";
import {
  formatFriendlyTitle,
  formatFriendlyMessage,
} from "@/components/common/NotificationDropdown";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error" | "ai";
  timestamp: number;
  duration?: number;
}

// Global toast state subscribers
type ToastListener = (toasts: ToastItem[]) => void;
let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function addToast(
  toast: Omit<ToastItem, "id" | "timestamp"> & { id?: string },
) {
  const newToast: ToastItem = {
    id: toast.id || crypto.randomUUID(),
    title: formatFriendlyTitle(toast.title),
    message: formatFriendlyMessage(toast.message),
    type: toast.type,
    timestamp: Date.now(),
    duration: toast.duration ?? 5000,
  };

  // Limit maximum active toasts to 5
  toasts = [newToast, ...toasts].slice(0, 5);
  notifyListeners();

  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(newToast.id);
    }, newToast.duration);
  }

  return newToast.id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function useToastNotifications() {
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>(toasts);
  const { subscribe, isConnected } = useSignalR();

  useEffect(() => {
    listeners.add(setActiveToasts);
    return () => {
      listeners.delete(setActiveToasts);
    };
  }, []);

  // Subscribe to SignalR typed events
  useEffect(() => {
    const handleInterviewScheduled = (payload: SignalRNotificationPayload) => {
      addToast({
        title: payload.title || "Interview Scheduled",
        message: payload.message,
        type: "success",
        duration: 6000,
      });
    };

    const handleApplicationUpdate = (payload: SignalRNotificationPayload) => {
      addToast({
        title: payload.title || "Application Update",
        message: payload.message,
        type: "info",
        duration: 6000,
      });
    };

    const handleAiEvaluationComplete = (
      payload: SignalRNotificationPayload,
    ) => {
      addToast({
        title: payload.title || "Evaluation Ready",
        message: payload.message,
        type: "ai",
        duration: 8000,
      });
    };

    const handleApprovalRequired = (payload: SignalRNotificationPayload) => {
      addToast({
        title: payload.title || "Review Required",
        message: payload.message,
        type: "warning",
        duration: 8000,
      });
    };

    const handleFeedbackSubmitted = (payload: SignalRNotificationPayload) => {
      addToast({
        title: payload.title || "Interview Feedback Submitted",
        message: payload.message,
        type: "info",
        duration: 6000,
      });
    };

    const unsubInterview = subscribe(
      "InterviewScheduled",
      handleInterviewScheduled,
    );
    const unsubApp = subscribe("ApplicationUpdate", handleApplicationUpdate);
    const unsubAi = subscribe(
      "AiEvaluationComplete",
      handleAiEvaluationComplete,
    );
    const unsubApproval = subscribe("ApprovalRequired", handleApprovalRequired);
    const unsubFeedback = subscribe(
      "FeedbackSubmitted",
      handleFeedbackSubmitted,
    );

    return () => {
      unsubInterview();
      unsubApp();
      unsubAi();
      unsubApproval();
      unsubFeedback();
    };
  }, [subscribe]);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return {
    toasts: activeToasts,
    dismiss,
    addToast,
    isConnected,
  };
}
