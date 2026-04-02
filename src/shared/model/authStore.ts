import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  role: 'respondent' | 'admin'
  trust_level: number
  profile_score: number
  preferred_lang: string
  is_verified: boolean
  warning_count: number
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (tokens: { access_token: string; refresh_token: string }, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  setTokens: (access_token: string, refresh_token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: (tokens, user) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          user,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      setTokens: (access_token, refresh_token) =>
        set({ accessToken: access_token, refreshToken: refresh_token }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
