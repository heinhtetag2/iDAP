import { Navigate } from 'react-router-dom'
import { useAdminAuthStore } from '@/shared/model/adminAuthStore'
import { ROUTES } from '@/shared/config/routes'

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuthStore()
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />
  }
  return <>{children}</>
}
