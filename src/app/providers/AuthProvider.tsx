import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '@/shared/model/authStore'
import { fetchCurrentUser } from '@/entities/user'
import { Spinner } from '@/shared/ui'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, setUser, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    fetchCurrentUser()
      .then((user) => setUser(user))
      .catch(() => logout())
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
