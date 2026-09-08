import { useUser, useAuth, useOrganization } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, setAuthTokenGetter } from '@/lib/api-client'
import type { ApiResponse, UserProfile, UserRole } from '@/types/auth'
import { useEffect } from 'react'

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const { organization: clerkOrg } = useOrganization()
  const { getToken } = useAuth()

  useEffect(() => {
    if (getToken) {
      setAuthTokenGetter(() => getToken())
    }
  }, [getToken])

  const metadataRole = (clerkUser?.publicMetadata?.role as string) || (clerkUser?.unsafeMetadata?.role as string)
  const orgId = clerkOrg?.id || clerkUser?.organizationMemberships?.[0]?.organization?.id
  const localRole = (typeof window !== 'undefined' ? localStorage.getItem('hirewise_selected_role') : null) as UserRole | null
  const effectiveRole = metadataRole || localRole

  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['currentUser', clerkUser?.id, orgId, effectiveRole],
    queryFn: async () => {
      if (!isSignedIn) return null
      const token = await getToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (orgId && effectiveRole !== 'CANDIDATE') headers['X-Clerk-Org-Id'] = orgId
      if (effectiveRole) headers['X-Clerk-Role'] = effectiveRole
      if (clerkUser?.primaryEmailAddress?.emailAddress) headers['X-Clerk-Email'] = clerkUser.primaryEmailAddress.emailAddress

      const res = await apiClient.get<ApiResponse<UserProfile>>('/users/me', { headers })
      return res.data.data
    },
    enabled: isClerkLoaded && !!isSignedIn
  })

  // Role hierarchy:
  // 1. Backend database profile role (authoritative)
  // 2. Clerk user metadata role (unsafeMetadata / publicMetadata)
  // 3. Stored local role from sign-up or explicit switch
  // 4. Fallback to org membership (if orgId present and no role) or default CANDIDATE
  const role: UserRole = (
    profileResponse?.role
      || (metadataRole as UserRole)
      || (localRole as UserRole)
      || (orgId ? 'RECRUITER' : 'CANDIDATE')
  )
  const status = profileResponse?.status || 'ACTIVE'

  const changeRole = async (newRole: UserRole) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hirewise_selected_role', newRole)
      }
      if (clerkUser) {
        await clerkUser.update({
          unsafeMetadata: {
            ...clerkUser.unsafeMetadata,
            role: newRole
          }
        })
      }
      await apiClient.put('/users/me/role', { role: newRole })
      await refetch()
    } catch (err) {
      console.error('Failed to change role:', err)
      throw err
    }
  }

  return {
    clerkUser,
    profile: profileResponse,
    role,
    status,
    isLoading: !isClerkLoaded || (isSignedIn && isProfileLoading),
    isSignedIn: !!isSignedIn,
    refetchProfile: refetch,
    changeRole,
    error
  }
}
