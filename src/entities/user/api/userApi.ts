import { apiClient } from '@/shared/api'
import type { AuthUser } from '@/shared/model/authStore'
import type { UserProfile, ProfileScore } from '../model/user.types'

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get('/auth/me')
  return data as AuthUser
}

export async function fetchProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get('/respondent/profile')
  return data as UserProfile
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const { data } = await apiClient.put('/respondent/profile', profile)
  return data as UserProfile
}

export async function fetchProfileScore(): Promise<ProfileScore> {
  const { data } = await apiClient.get('/respondent/profile/score')
  return data as ProfileScore
}
