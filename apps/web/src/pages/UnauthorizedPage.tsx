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
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 text-white">
      <div className="glass-panel max-w-md rounded-2xl p-8 text-center border border-slate-800 shadow-2xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
          <p className="text-sm text-slate-400">
            You do not have the required permissions or role (<span className="text-white font-medium">{role || 'Guest'}</span>) to view this resource.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={dashboardPath}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Go to My Dashboard
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            <Home className="h-4 w-4" /> Return Home
          </Link>
        </div>

        {role && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Need a different role?</span>
            {role !== 'CANDIDATE' && (
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitch('CANDIDATE')}
                className="text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Switch to Candidate
              </button>
            )}
            {role !== 'RECRUITER' && (
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitch('RECRUITER')}
                className="text-purple-400 hover:text-purple-300 underline font-medium"
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
