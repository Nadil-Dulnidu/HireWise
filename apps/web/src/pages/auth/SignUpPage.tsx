import { useState, useEffect } from 'react'
import { SignUp } from '@clerk/clerk-react'
import { Sparkles, User, Building, UserCheck } from 'lucide-react'
import type { UserRole } from '@/types/auth'

export function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    return (localStorage.getItem('hirewise_selected_role') as UserRole) || 'CANDIDATE'
  })

  useEffect(() => {
    localStorage.setItem('hirewise_selected_role', selectedRole)
  }, [selectedRole])

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    localStorage.setItem('hirewise_selected_role', role)
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

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-3 p-1.5 rounded-2xl glass-panel border border-slate-800">
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

          <button
            type="button"
            onClick={() => handleRoleChange('INTERVIEWER')}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition text-xs font-medium ${
              selectedRole === 'INTERVIEWER'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <UserCheck className="h-5 w-5" />
            <span>Interviewer</span>
            <span className="text-[10px] text-slate-500 font-normal">Team Member</span>
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
            appearance={{
              elements: {
                card: 'glass-panel border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/90 text-white',
                headerTitle: 'text-white font-bold',
                headerSubtitle: 'text-slate-400',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl',
                formFieldInput: 'bg-slate-950 border-slate-800 text-white rounded-xl focus:border-blue-500',
                formFieldLabel: 'text-slate-300',
                footerActionLink: 'text-blue-400 hover:text-blue-300 font-medium'
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
