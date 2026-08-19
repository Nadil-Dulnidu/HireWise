import { Link } from 'react-router-dom'
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react'
import { useToastNotifications } from '@/hooks/useToastNotifications'
import type { ToastItem } from '@/hooks/useToastNotifications'

export function ToastContainer() {
  const { toasts, dismiss } = useToastNotifications()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  )
}

interface ToastCardProps {
  toast: ToastItem
  onDismiss: () => void
}

function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const { id, title, message, type, link } = toast

  const config = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      badgeBg: 'bg-emerald-500/20 text-emerald-300'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      glow: 'shadow-blue-500/10',
      badgeBg: 'bg-blue-500/20 text-blue-300'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      glow: 'shadow-amber-500/10',
      badgeBg: 'bg-amber-500/20 text-amber-300'
    },
    error: {
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      glow: 'shadow-rose-500/10',
      badgeBg: 'bg-rose-500/20 text-rose-300'
    },
    ai: {
      icon: Sparkles,
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      glow: 'shadow-purple-500/20',
      badgeBg: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-300'
    }
  }[type] || {
    icon: Info,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    badgeBg: 'bg-blue-500/20 text-blue-300'
  }

  const Icon = config.icon

  return (
    <div
      role="alert"
      id={`toast-${id}`}
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-xl border backdrop-blur-xl bg-slate-900/90 text-slate-100 shadow-xl ${config.borderColor} ${config.glow} transition-all duration-300 animate-in slide-in-from-top-3 fade-in`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-tight text-white line-clamp-1">
            {title}
          </h4>
        </div>
        <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {message}
        </p>

        {link && (
          <div className="mt-2.5">
            <Link
              to={link}
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>View details</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-800/60"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
