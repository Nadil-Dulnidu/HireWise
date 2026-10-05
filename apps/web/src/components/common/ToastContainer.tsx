import {
  CheckCircle,
  AlertTriangle,
  Info,
  Bot,
  X,
} from "lucide-react";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import type { ToastItem } from "@/hooks/useToastNotifications";

export function ToastContainer() {
  const { toasts, dismiss } = useToastNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { id, title, message, type } = toast;

  const config = {
    success: {
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      glow: "shadow-emerald-500/5",
      badgeBg: "bg-emerald-50 text-emerald-700",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      glow: "shadow-blue-500/5",
      badgeBg: "bg-blue-50 text-blue-700",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      glow: "shadow-amber-500/5",
      badgeBg: "bg-amber-50 text-amber-700",
    },
    error: {
      icon: AlertTriangle,
      iconColor: "text-rose-600",
      borderColor: "border-rose-200",
      glow: "shadow-rose-500/5",
      badgeBg: "bg-rose-50 text-rose-700",
    },
    ai: {
      icon: Bot,
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200",
      glow: "shadow-indigo-500/5",
      badgeBg: "bg-indigo-50 text-indigo-700",
    },
  }[type] || {
    icon: Info,
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    glow: "shadow-blue-500/5",
    badgeBg: "bg-blue-50 text-blue-700",
  };

  const Icon = config.icon;

  return (
    <div
      role="alert"
      id={`toast-${id}`}
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-xl border bg-white text-slate-900 shadow-lg ${config.borderColor} ${config.glow} transition-all duration-300 animate-in slide-in-from-top-3 fade-in`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-slate-900 line-clamp-1">
            {title}
          </h4>
        </div>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
