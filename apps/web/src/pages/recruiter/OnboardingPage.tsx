import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CreateOrganization, useOrganizationList } from '@clerk/clerk-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Users, CheckCircle2, Loader2, User, ArrowRight, Bot } from 'lucide-react'

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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">
            {isSwitching ? 'Switching to Candidate account...' : 'Verifying workspace credentials...'}
          </p>
        </div>
      </div>
    )
  }

  if (hasExistingOrg && role === 'RECRUITER') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Redirecting to your recruiter dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Information & Value Props */}
        <div className="lg:col-span-5 space-y-6">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <img
              src="/main-logo.png"
              alt="HireWise"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create your Company Workspace</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Name your organization to create a dedicated multi-tenant hiring portal. You'll be able to publish jobs, configure autonomous AI evaluation workflows, and invite your engineering team.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-50 p-1 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Instant Company Portal</h4>
                <p className="text-[11px] text-slate-500">No waiting for admin approvals — get hiring immediately.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-purple-50 p-1 text-purple-600 border border-purple-200">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Direct Interviewer Invites</h4>
                <p className="text-[11px] text-slate-500">Invite engineers & hiring managers directly to your team.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-50 p-1 text-blue-600 border border-blue-200">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Autonomous AI Screening</h4>
                <p className="text-[11px] text-slate-500">Automated resume parsing, rubrics, and question generation.</p>
              </div>
            </div>
          </div>

          {/* Escape Hatch for Candidates */}
          <div className="pt-4 border-t border-slate-200">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold">
                <User className="h-4 w-4 text-blue-600" /> Not an Employer / Recruiter?
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Looking to explore jobs, submit resumes, or attend technical interviews?
              </p>
              <button
                type="button"
                onClick={handleSwitchToCandidate}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition"
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}
