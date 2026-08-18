import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateOrganization, useOrganizationList } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Building2, Sparkles, Users, CheckCircle2, Loader2, User, ArrowRight } from 'lucide-react'

export function OnboardingPage() {
  const navigate = useNavigate()
  const [isSwitching, setIsSwitching] = useState(false)
  const { userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({
    userMemberships: { infinite: true }
  })
  const { profile, status, role, clerkUser, changeRole, isLoading: isUserLoading } = useCurrentUser()

  const hasExistingOrg =
    (userMemberships?.data && userMemberships.data.length > 0) ||
    (clerkUser?.organizationMemberships && clerkUser.organizationMemberships.length > 0) ||
    !!profile?.companyId ||
    status === 'ACTIVE'

  useEffect(() => {
    if (!isUserLoading && role === 'CANDIDATE') {
      navigate('/candidate/dashboard', { replace: true })
      return
    }

    if (isOrgListLoaded && !isUserLoading && hasExistingOrg && role === 'RECRUITER') {
      navigate('/recruiter/dashboard', { replace: true })
    }
  }, [isOrgListLoaded, isUserLoading, hasExistingOrg, role, navigate])

  const handleSwitchToCandidate = async () => {
    setIsSwitching(true)
    try {
      await changeRole('CANDIDATE')
      navigate('/candidate/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to switch to candidate:', err)
      setIsSwitching(false)
    }
  }

  if (!isOrgListLoaded || isUserLoading || isSwitching) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-400">
            {isSwitching ? 'Switching to Candidate account...' : 'Verifying workspace credentials...'}
          </p>
        </div>
      </div>
    )
  }

  if (hasExistingOrg && role === 'RECRUITER') {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-400">Redirecting to your recruiter dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Information & Value Props */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20">
            <Building2 className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Recruiter Workspace Setup
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Create your Company Workspace</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Name your organization to create a dedicated multi-tenant hiring portal. You'll be able to publish jobs, configure autonomous AI evaluation workflows, and invite your engineering team.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Instant Company Portal</h4>
                <p className="text-[11px] text-slate-400">No waiting for admin approvals — get hiring immediately.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-purple-500/10 p-1 text-purple-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Direct Interviewer Invites</h4>
                <p className="text-[11px] text-slate-400">Invite engineers & hiring managers directly to your team.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-500/10 p-1 text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Autonomous AI Screening</h4>
                <p className="text-[11px] text-slate-400">Automated resume parsing, rubrics, and question generation.</p>
              </div>
            </div>
          </div>

          {/* Escape Hatch for Candidates */}
          <div className="pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <User className="h-4 w-4" /> Not an Employer / Recruiter?
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Looking to explore jobs, submit resumes, or attend technical interviews?
              </p>
              <button
                type="button"
                onClick={handleSwitchToCandidate}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-2 text-xs font-medium text-blue-300 transition"
              >
                Continue as Job Seeker (Candidate) <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Clerk CreateOrganization Component */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-md">
            <CreateOrganization
              routing="path"
              path="/recruiter/onboarding"
              afterCreateOrganizationUrl="/recruiter/dashboard"
              skipInvitationScreen={true}
              appearance={{
                elements: {
                  card: 'glass-panel border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/90 text-white',
                  headerTitle: 'text-white font-bold text-xl',
                  headerSubtitle: 'text-slate-400 text-xs',
                  formButtonPrimary: 'bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition',
                  formFieldInput: 'bg-slate-950 border-slate-800 text-white rounded-xl focus:border-purple-500',
                  formFieldLabel: 'text-slate-300 text-xs font-medium',
                  footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium text-xs'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

