import { Navigate } from 'react-router-dom'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { ROUTES } from '@/shared/config/routes'

export function CompanyProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useCompanyAuthStore()
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.COMPANY_LOGIN} replace />
  }
  return <>{children}</>
}
