import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/shared/model/authStore'
import { ROUTES } from '@/shared/config/routes'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireProfile?: boolean
  minProfileScore?: number
}

export function ProtectedRoute({
  children,
  requireProfile = false,
  minProfileScore = 50,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (requireProfile && user && user.profile_score < minProfileScore) {
    return <Navigate to={ROUTES.PROFILE_SETUP} replace />
  }

  return <>{children}</>
}
