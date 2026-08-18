import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { apiClient } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'
import type { UserRole } from '@/types/auth'

export function AuthRedirectPage() {
  const navigate = useNavigate()
  const { isSignedIn, isLoading, role, status, clerkUser, profile, refetchProfile } = useCurrentUser()
  const syncAttempted = useRef(false)

  useEffect(() => {
    if (isLoading) return

    if (!isSignedIn) {
      navigate('/sign-in', { replace: true })
      return
    }

    const processRedirect = async () => {
      const storedRole = (localStorage.getItem('hirewise_selected_role') as UserRole | null)

      // If a role was selected during registration/sign-up, apply and sync it
      if (storedRole && !syncAttempted.current) {
        syncAttempted.current = true
        localStorage.removeItem('hirewise_selected_role')

        try {
          if (clerkUser && clerkUser.unsafeMetadata?.role !== storedRole) {
            await clerkUser.update({
              unsafeMetadata: {
                ...clerkUser.unsafeMetadata,
                role: storedRole
              }
            })
          }

          if (profile && profile.role !== storedRole) {
            await apiClient.put('/users/me/role', { role: storedRole })
            await refetchProfile()
          }
        } catch (err) {
          console.error('Role sync error during redirect:', err)
        }

        if (storedRole === 'CANDIDATE') {
          navigate('/candidate/dashboard', { replace: true })
          return
        }
        if (storedRole === 'RECRUITER') {
          const hasClerkOrg = (clerkUser?.organizationMemberships && clerkUser.organizationMemberships.length > 0)
          const hasDbCompany = !!profile?.companyId
          if (!hasClerkOrg && !hasDbCompany) {
            navigate('/recruiter/onboarding', { replace: true })
          } else {
            navigate('/recruiter/dashboard', { replace: true })
          }
          return
        }
        if (storedRole === 'INTERVIEWER') {
          navigate('/interviewer/dashboard', { replace: true })
          return
        }
      }

      // Existing user role-based redirection
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
    }

    processRedirect()
  }, [isLoading, isSignedIn, role, status, clerkUser, profile, refetchProfile, navigate])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0b0f19] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-400">Directing to your workspace...</p>
      </div>
    </div>
  )
}
