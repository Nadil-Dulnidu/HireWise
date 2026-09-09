import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Loader2, ShieldAlert } from 'lucide-react'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  allowOnboarding?: boolean
}

export function ProtectedRoute({ allowedRoles, allowOnboarding = false }: ProtectedRouteProps) {
  const { isSignedIn, isLoading, role, status, clerkUser } = useCurrentUser()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Authenticating session...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // Account Inactive / Banned
  if (status === 'INACTIVE') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="bg-white max-w-md rounded-2xl p-8 text-center shadow-xl border border-red-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Account Deactivated</h2>
          <p className="mt-3 text-sm text-slate-500">
            Your account has been deactivated or suspended by platform administrators.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Recruiter in ONBOARDING state needs to create a Clerk Organization (only if they don't already have one)
  const hasClerkOrg = !!(clerkUser?.organizationMemberships && clerkUser.organizationMemberships.length > 0)
  if (status === 'ONBOARDING' && role === 'RECRUITER' && !hasClerkOrg && !allowOnboarding && location.pathname !== '/recruiter/onboarding') {
    return <Navigate to="/recruiter/onboarding" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role as UserRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
