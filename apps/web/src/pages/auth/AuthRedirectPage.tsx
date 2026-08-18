import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Loader2 } from 'lucide-react'

export function AuthRedirectPage() {
  const navigate = useNavigate()
  const { isSignedIn, isLoading, role, status, clerkUser, profile } = useCurrentUser()

  useEffect(() => {
    if (isLoading) return

    if (!isSignedIn) {
      navigate('/sign-in', { replace: true })
      return
    }

    // Role-based redirection
    if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true })
      return
    }

    if (role === 'RECRUITER') {
      const hasClerkOrg = (clerkUser?.organizationMemberships && clerkUser.organizationMemberships.length > 0)
      const hasDbCompany = !!profile?.companyId

      if (status === 'ONBOARDING' && !hasClerkOrg && !hasDbCompany) {
        navigate('/recruiter/onboarding', { replace: true })
      } else {
        navigate('/recruiter/dashboard', { replace: true })
      }
      return
    }

    if (role === 'INTERVIEWER') {
      navigate('/interviewer/dashboard', { replace: true })
      return
    }

    // Default to candidate dashboard
    navigate('/candidate/dashboard', { replace: true })
  }, [isLoading, isSignedIn, role, status, clerkUser, profile, navigate])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b0f19] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-400">Directing to your workspace...</p>
      </div>
    </div>
  )
}
