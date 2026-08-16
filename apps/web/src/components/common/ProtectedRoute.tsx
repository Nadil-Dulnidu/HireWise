import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Loader2, Clock, AlertTriangle } from 'lucide-react'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isSignedIn, isLoading, role, status } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0b0f19] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-400">Authenticating session...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // Account Pending Approval state (Recruiter & Interviewer roles require Admin approval)
  if (status === 'PENDING_APPROVAL' && role !== 'CANDIDATE') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] p-4 text-white">
        <div className="glass-panel max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Account Pending Approval</h2>
          <p className="mt-3 text-sm text-slate-400">
            Your registration as a <span className="font-semibold text-white">{role}</span> has been received and is awaiting administrator verification.
          </p>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400 text-left">
            <div className="flex items-center gap-2 text-amber-300 font-medium mb-1">
              <AlertTriangle className="h-4 w-4" /> Next Steps:
            </div>
            Platform administrators review new recruiter and interviewer accounts. You will gain access once verified.
          </div>
          <div className="mt-6">
            <a
              href="/candidate/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              Continue as Candidate
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(role as UserRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
