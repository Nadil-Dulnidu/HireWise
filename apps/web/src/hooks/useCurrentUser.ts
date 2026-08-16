import { useUser, useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, setAuthTokenGetter } from '@/lib/api-client'
import type { ApiResponse, UserProfile } from '@/types/auth'
import { useEffect } from 'react'

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    if (getToken) {
      setAuthTokenGetter(() => getToken())
    }
  }, [getToken])

  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['currentUser', clerkUser?.id],
    queryFn: async () => {
      if (!isSignedIn) return null
      const token = await getToken()
      const res = await apiClient.get<ApiResponse<UserProfile>>('/users/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      return res.data.data
    },
    enabled: isClerkLoaded && !!isSignedIn
  })

  // Fallback to role from Clerk metadata if DB sync is pending
  const role = profileResponse?.role || (clerkUser?.publicMetadata?.role as string) || (clerkUser?.unsafeMetadata?.role as string) || 'CANDIDATE'
  const status = profileResponse?.status || 'ACTIVE'

  return {
    clerkUser,
    profile: profileResponse,
    role,
    status,
    isLoading: !isClerkLoaded || (isSignedIn && isProfileLoading),
    isSignedIn: !!isSignedIn,
    refetchProfile: refetch,
    error
  }
}
