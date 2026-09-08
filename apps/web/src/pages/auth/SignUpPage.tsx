import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SignUp, useClerk } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { Sparkles, User, Building, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { UserRole } from '@/types/auth'

export function SignUpPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const clerk = useClerk()
  const { isSignedIn, clerkUser, role: currentRole, changeRole } = useCurrentUser()
  const [isSwitching, setIsSwitching] = useState(false)

  const initialRoleFromParam = searchParams.get('role')?.toUpperCase() as UserRole | undefined
  const validRoles: UserRole[] = ['CANDIDATE', 'RECRUITER']

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (initialRoleFromParam && validRoles.includes(initialRoleFromParam)) {
      return initialRoleFromParam
    }
    return 'CANDIDATE'
  })

  useEffect(() => {
    localStorage.setItem('hirewise_selected_role', selectedRole)
  }, [selectedRole])

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    localStorage.setItem('hirewise_selected_role', role)
  }

  const handleSwitchToCandidate = async () => {
    setIsSwitching(true)
    try {
      await changeRole('CANDIDATE')
      navigate('/candidate/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to switch role:', err)
      setIsSwitching(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create your HireWise Account</h1>
          <p className="text-xs text-slate-400">Choose your account role to get started</p>
        </div>

        {/* Already Signed In Alert / Switcher */}
        {isSignedIn && clerkUser && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-950/40 backdrop-blur-md p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="text-xs text-slate-300">
                You are currently signed in as <span className="font-semibold text-white">{clerkUser.primaryEmailAddress?.emailAddress}</span> with role <span className="font-semibold text-blue-400">{currentRole}</span>.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const path =
                    currentRole === 'ADMIN' ? '/admin/dashboard' :
                    currentRole === 'RECRUITER' ? '/recruiter/dashboard' :
                    currentRole === 'INTERVIEWER' ? '/interviewer/dashboard' :
                    '/candidate/dashboard'
                  navigate(path)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
              >
                Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </button>

              {currentRole !== 'CANDIDATE' && (
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={handleSwitchToCandidate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  {isSwitching ? 'Switching...' : 'Switch this Account to Candidate'}
                </button>
              )}

              <button
                type="button"
                onClick={() => clerk.signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition ml-auto"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Role Selector Tabs (Candidate / Recruiter) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl glass-panel border border-slate-800">
          <button
            type="button"
            onClick={() => handleRoleChange('CANDIDATE')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition text-xs font-medium ${
              selectedRole === 'CANDIDATE'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Candidate</span>
            <span className="text-[10px] text-slate-500 font-normal">Job Seeker</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('RECRUITER')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition text-xs font-medium ${
              selectedRole === 'RECRUITER'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Building className="h-5 w-5" />
            <span>Recruiter</span>
            <span className="text-[10px] text-slate-500 font-normal">Self-Service Setup</span>
          </button>
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/auth-redirect"
            fallbackRedirectUrl="/auth-redirect"
            forceRedirectUrl="/auth-redirect"
            unsafeMetadata={{ role: selectedRole }}
            appearance={{
              baseTheme: dark
            }}
          />
        </div>
      </div>
    </div>
  )
}
