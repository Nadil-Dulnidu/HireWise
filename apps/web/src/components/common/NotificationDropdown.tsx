import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Cpu,
  Calendar,
  FileText,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications-api";
import type { AppNotification } from "@/lib/api/notifications-api";
import { useSignalR } from "@/hooks/useSignalR";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function formatFriendlyTitle(title: string): string {
  if (!title) return "";
  return title
    .replace(/\bAI_EVALUATION_COMPLETE\b/g, "Evaluation Complete")
    .replace(/\bAPPLICATION_UPDATE\b/g, "Application Update")
    .replace(/\bINTERVIEW_SCHEDULED\b/g, "Interview Scheduled")
    .replace(/\bAPPROVAL_REQUIRED\b/g, "Review Required")
    .replace(/\bFEEDBACK_SUBMITTED\b/g, "Feedback Submitted")
    .replace(/AI Evaluation Ready For Review/gi, "Candidate Ready for Review")
    .replace(/Application AI Review Complete/gi, "Application Under Review")
    .replace(/AI Evaluation Ready ⚡/gi, "Evaluation Ready")
    .replace(/Action Required ⚠️/gi, "Review Required")
    .trim();
}

export function formatFriendlyMessage(message: string): string {
  if (!message) return "";
  return message
    .replace(/status changed to: AI RECOMMENDED/gi, "status updated to: Advanced to next review stage")
    .replace(/status changed to: AI REVIEW/gi, "status updated to: Under review")
    .replace(/status changed to: RECRUITER REVIEW/gi, "status updated to: Under recruiter review")
    .replace(/status changed to: INTERVIEW APPROVED/gi, "status updated to: Shortlisted for interview")
    .replace(/status changed to: INTERVIEW SCHEDULED/gi, "status updated to: Interview scheduled")
    .replace(/status changed to: INTERVIEW COMPLETED/gi, "status updated to: Interview completed")
    .replace(/status changed to: EVALUATION PENDING/gi, "status updated to: Evaluation in progress")
    .replace(/status changed to: SELECTED/gi, "status updated to: Selected")
    .replace(/status changed to: REJECTED/gi, "status updated to: Not selected")
    .replace(/\bAI_RECOMMENDED\b/g, "Under Review")
    .replace(/\bAI_REVIEW\b/g, "Under Review")
    .replace(/\bINTERVIEW_APPROVED\b/g, "Shortlisted")
    .replace(/\bINTERVIEW_SCHEDULED\b/g, "Scheduled")
    .replace(/\bINTERVIEW_COMPLETED\b/g, "Completed")
    .replace(/\bEVALUATION_PENDING\b/g, "Evaluation Pending")
    .replace(/\bSTRONG_HIRE\b/g, "Strongly Recommended")
    .replace(/\bSTRONG HIRE\b/g, "Strongly Recommended")
    .replace(/\bNO_HIRE\b/g, "Not Recommended")
    .replace(/\bNO HIRE\b/g, "Not Recommended")
    .replace(/\bSTRONG_NO_HIRE\b/g, "Not Recommended")
    .replace(/\bSTRONG NO HIRE\b/g, "Not Recommended")
    .replace(/is queued for AI review/gi, "is under review")
    .replace(/completed preliminary evaluation and is now under recruiter review/gi, "is currently under review by the hiring team")
    .replace(/AI analysis completed for/gi, "Candidate review ready for")
    .replace(/Recommendation is awaiting your review/gi, "Candidate is awaiting your review")
    .replace(/AI has recommended interview slots for/gi, "Suggested interview time slots are ready for")
    .trim();
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useCurrentUser();
  const { subscribe } = useSignalR();

  // Query notifications list
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(30),
    enabled: isOpen && !!isSignedIn,
    staleTime: 10000,
  });

  // Query unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!isSignedIn,
    staleTime: 10000,
  });

  // Mutation: Mark single as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  // Mutation: Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  // Listen to live SignalR events to invalidate query cache
  useEffect(() => {
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    };

    const unsubReceive = subscribe(
      "ReceiveNotification",
      handleNewNotification,
    );
    const unsubInterview = subscribe(
      "InterviewScheduled",
      handleNewNotification,
    );
    const unsubApp = subscribe("ApplicationUpdate", handleNewNotification);
    const unsubAi = subscribe("AiEvaluationComplete", handleNewNotification);
    const unsubApproval = subscribe("ApprovalRequired", handleNewNotification);
    const unsubFeedback = subscribe("FeedbackSubmitted", handleNewNotification);

    return () => {
      unsubReceive();
      unsubInterview();
      unsubApp();
      unsubAi();
      unsubApproval();
      unsubFeedback();
    };
  }, [subscribe, queryClient]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-blue-100 px-2 text-[11px] font-bold text-blue-700 border border-blue-200">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Loading notifications...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
            <p className="text-xs text-slate-600">
              Could not load notifications
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              All caught up!
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
              You have no new notifications right now.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onClick={() => handleNotificationClick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: () => void;
}) {
  const { title, message, type, isRead, createdAt } = notification;
  const friendlyTitle = formatFriendlyTitle(title);
  const friendlyMessage = formatFriendlyMessage(message);

  const config = {
    APPLICATION_UPDATE: {
      icon: FileText,
      iconColor: "text-blue-600",
      bg: "bg-blue-50 border border-blue-100",
    },
    INTERVIEW_SCHEDULED: {
      icon: Calendar,
      iconColor: "text-emerald-600",
      bg: "bg-emerald-50 border border-emerald-100",
    },
    AI_EVALUATION_COMPLETE: {
      icon: Cpu,
      iconColor: "text-purple-600",
      bg: "bg-purple-50 border border-purple-100",
    },
    APPROVAL_REQUIRED: {
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      bg: "bg-amber-50 border border-amber-100",
    },
    FEEDBACK_SUBMITTED: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bg: "bg-emerald-50 border border-emerald-100",
    },
    GENERAL: {
      icon: Bell,
      iconColor: "text-slate-500",
      bg: "bg-slate-100",
    },
  }[type] || {
    icon: Bell,
    iconColor: "text-slate-500",
    bg: "bg-slate-100",
  };

  const Icon = config.icon;

  // Format relative or date time
  const timeAgo = formatTimeAgo(createdAt);

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
        !isRead ? "bg-blue-50/60 hover:bg-blue-50/90" : "hover:bg-slate-50"
      }`}
    >
      {/* Type Icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.bg} mt-0.5`}
      >
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-1.5">
          <h4
            className={`text-xs font-semibold truncate ${!isRead ? "text-slate-900 font-bold" : "text-slate-700"}`}
          >
            {friendlyTitle}
          </h4>
          <span className="text-[10px] text-slate-400 shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
          {friendlyMessage}
        </p>
      </div>

      {/* Unread indicator dot */}
      {!isRead && (
        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
