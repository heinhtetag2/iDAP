import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/config/queryKeys'
import { useAuthStore } from '@/shared/model/authStore'
import { fetchCurrentUser, fetchProfile, updateProfile, fetchProfileScore } from '../api/userApi'

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    enabled: useAuthStore.getState().isAuthenticated,
  })
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      const user = useAuthStore.getState().user
      if (user) setUser({ ...user, profile_score: data.profile_score })
    },
  })
}

export function useProfileScore() {
  return useQuery({
    queryKey: ['profile', 'score'],
    queryFn: fetchProfileScore,
    staleTime: 5 * 60 * 1000,
  })
}
