import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const { role, changeRole } = useCurrentUser()
  const [isSwitching, setIsSwitching] = useState(false)

  const dashboardPath =
    role === 'ADMIN' ? '/admin/dashboard' :
    role === 'RECRUITER' ? '/recruiter/dashboard' :
    role === 'INTERVIEWER' ? '/interviewer/dashboard' :
    '/candidate/dashboard'

  const handleSwitch = async (newRole: 'CANDIDATE' | 'RECRUITER') => {
    setIsSwitching(true)
    try {
      await changeRole(newRole)
      navigate(newRole === 'CANDIDATE' ? '/candidate/dashboard' : '/recruiter/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to switch role:', err)
      setIsSwitching(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="bg-white max-w-md rounded-3xl p-8 text-center border border-slate-200 shadow-xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-500">
            You do not have the required permissions or role (<span className="text-slate-900 font-semibold">{role || 'Guest'}</span>) to view this resource.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={dashboardPath}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
          >
            <ArrowLeft className="h-4 w-4" /> Go to My Dashboard
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
          >
            <Home className="h-4 w-4" /> Return Home
          </Link>
        </div>

        {role && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Need a different role?</span>
            {role !== 'CANDIDATE' && (
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitch('CANDIDATE')}
                className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
              >
                Switch to Candidate
              </button>
            )}
            {role !== 'RECRUITER' && (
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitch('RECRUITER')}
                className="text-indigo-600 hover:text-indigo-700 underline font-medium cursor-pointer"
              >
                Switch to Recruiter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
