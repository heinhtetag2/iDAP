import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  admin_role: 'super_admin' | 'support' | 'moderator'
  avatar_url?: string
}

interface AdminAuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AdminUser | null
  isAuthenticated: boolean
  login: (tokens: { access_token: string; refresh_token: string }, user: AdminUser) => void
  setUser: (user: AdminUser) => void
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
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

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
