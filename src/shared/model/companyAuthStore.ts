import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CompanyUser {
  id: string
  email: string
  full_name: string
  company_id: string
  company_name: string
  company_logo?: string
  role: 'owner' | 'admin' | 'member'
  credits_balance: number
  is_approved: boolean
  plan: 'starter' | 'growth' | 'enterprise'
}

interface CompanyAuthState {
  accessToken: string | null
  refreshToken: string | null
  user: CompanyUser | null
  isAuthenticated: boolean
  login: (tokens: { access_token: string; refresh_token: string }, user: CompanyUser) => void
  setUser: (user: CompanyUser) => void
  logout: () => void
}

export const useCompanyAuthStore = create<CompanyAuthState>()(
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
      name: 'company-auth-storage',
    }
  )
)
