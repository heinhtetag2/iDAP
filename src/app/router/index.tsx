import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Spinner } from '@/shared/ui'
import { AuthLayout } from './layouts/AuthLayout'
import { RespondentLayout } from './layouts/RespondentLayout'
import { FullscreenLayout } from './layouts/FullscreenLayout'
import { CompanyLayout } from './layouts/CompanyLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { CompanyProtectedRoute } from './CompanyProtectedRoute'
import { AdminProtectedRoute } from './AdminProtectedRoute'

// ── Marketing ─────────────────────────────────────────
const MarketingPage = lazy(() => import('@/pages/marketing/MarketingPage'))

// ── Respondent pages ─────────────────────────────────
const PlatformSelectPage = lazy(() => import('@/pages/platform-select/PlatformSelectPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ProfileSetupPage = lazy(() => import('@/pages/profile-setup/ProfileSetupPage'))
const SurveyFeedPage = lazy(() => import('@/pages/survey-feed/SurveyFeedPage'))
const SurveyDetailPage = lazy(() => import('@/pages/survey-detail/SurveyDetailPage'))
const SurveyPlayerPage = lazy(() => import('@/pages/survey-player/SurveyPlayerPage'))
const SurveyCompletePage = lazy(() => import('@/pages/survey-complete/SurveyCompletePage'))
const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'))
const SurveyHistoryPage = lazy(() => import('@/pages/survey-history/SurveyHistoryPage'))
const WalletHistoryPage = lazy(() => import('@/pages/wallet-history/WalletHistoryPage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))

// ── Company pages ────────────────────────────────────
const CompanyLoginPage = lazy(() => import('@/pages/company/login/CompanyLoginPage'))
const CompanyDashboardPage = lazy(() => import('@/pages/company/dashboard/CompanyDashboardPage'))
const CompanySurveysPage = lazy(() => import('@/pages/company/surveys/CompanySurveysPage'))
const CompanySurveyDetailPage = lazy(() => import('@/pages/company/surveys/CompanySurveyDetailPage'))
const CompanySurveyBuilderPage = lazy(() => import('@/pages/company/surveys/CompanySurveyBuilderPage'))
const CompanyAnalyticsPage = lazy(() => import('@/pages/company/analytics/CompanyAnalyticsPage'))
const CompanyBillingPage = lazy(() => import('@/pages/company/billing/CompanyBillingPage'))
const CompanySettingsPage = lazy(() => import('@/pages/company/settings/CompanySettingsPage'))

// ── Admin pages ──────────────────────────────────────
const AdminLoginPage = lazy(() => import('@/pages/admin/login/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard/AdminDashboardPage'))
const AdminCompaniesPage = lazy(() => import('@/pages/admin/companies/AdminCompaniesPage'))
const AdminCompanyDetailPage = lazy(() => import('@/pages/admin/companies/AdminCompanyDetailPage'))
const AdminRespondentsPage = lazy(() => import('@/pages/admin/respondents/AdminRespondentsPage'))
const AdminRespondentDetailPage = lazy(() => import('@/pages/admin/respondents/AdminRespondentDetailPage'))
const AdminSurveysPage = lazy(() => import('@/pages/admin/surveys/AdminSurveysPage'))
const AdminSurveyDetailPage = lazy(() => import('@/pages/admin/surveys/AdminSurveyDetailPage'))
const AdminPayoutsPage = lazy(() => import('@/pages/admin/payouts/AdminPayoutsPage'))
const AdminFraudPage = lazy(() => import('@/pages/admin/fraud/AdminFraudPage'))
const AdminFraudDetailPage = lazy(() => import('@/pages/admin/fraud/AdminFraudDetailPage'))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const router = createBrowserRouter([
  // ── Portal chooser (homepage) ─────────────────────
  { path: '/', element: <S><PlatformSelectPage /></S> },

  // ── Marketing / About page ─────────────────────────
  { path: '/about', element: <S><MarketingPage /></S> },

  // ── Respondent auth ────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <S><LoginPage /></S> },
      { path: '/register', element: <S><RegisterPage /></S> },
    ],
  },

  // ── Respondent: profile setup (no sidebar) ─────────
  {
    path: '/profile-setup',
    element: (
      <ProtectedRoute>
        <S><ProfileSetupPage /></S>
      </ProtectedRoute>
    ),
  },

  // ── Respondent: fullscreen survey player ───────────
  {
    element: <FullscreenLayout />,
    children: [
      {
        path: '/surveys/:id/answer',
        element: <ProtectedRoute><S><SurveyPlayerPage /></S></ProtectedRoute>,
      },
      {
        path: '/surveys/:id/complete',
        element: <ProtectedRoute><S><SurveyCompletePage /></S></ProtectedRoute>,
      },
    ],
  },

  // ── Respondent: main layout ────────────────────────
  {
    element: (
      <ProtectedRoute requireProfile minProfileScore={30}>
        <RespondentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/feed', element: <S><SurveyFeedPage /></S> },
      { path: '/surveys/:id', element: <S><SurveyDetailPage /></S> },
      { path: '/surveys/history', element: <S><SurveyHistoryPage /></S> },
      { path: '/wallet', element: <S><WalletPage /></S> },
      { path: '/wallet/history', element: <S><WalletHistoryPage /></S> },
      { path: '/notifications', element: <S><NotificationsPage /></S> },
      { path: '/settings', element: <S><SettingsPage /></S> },
    ],
  },

  // ── Company: login ─────────────────────────────────
  { path: '/company/login', element: <S><CompanyLoginPage /></S> },

  // ── Company: dashboard ─────────────────────────────
  {
    element: (
      <CompanyProtectedRoute>
        <CompanyLayout />
      </CompanyProtectedRoute>
    ),
    children: [
      { path: '/company', element: <Navigate to="/company/dashboard" replace /> },
      { path: '/company/dashboard', element: <S><CompanyDashboardPage /></S> },
      { path: '/company/surveys', element: <S><CompanySurveysPage /></S> },
      { path: '/company/surveys/new', element: <S><CompanySurveyBuilderPage /></S> },
      { path: '/company/surveys/:id', element: <S><CompanySurveyDetailPage /></S> },
      { path: '/company/surveys/:id/edit', element: <S><CompanySurveyBuilderPage /></S> },
      { path: '/company/analytics', element: <S><CompanyAnalyticsPage /></S> },
      { path: '/company/billing', element: <S><CompanyBillingPage /></S> },
      { path: '/company/settings', element: <S><CompanySettingsPage /></S> },
    ],
  },

  // ── Admin: login ───────────────────────────────────
  { path: '/admin/login', element: <S><AdminLoginPage /></S> },

  // ── Admin: console ─────────────────────────────────
  {
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <S><AdminDashboardPage /></S> },
      { path: '/admin/companies', element: <S><AdminCompaniesPage /></S> },
      { path: '/admin/companies/:id', element: <S><AdminCompanyDetailPage /></S> },
      { path: '/admin/respondents', element: <S><AdminRespondentsPage /></S> },
      { path: '/admin/respondents/:id', element: <S><AdminRespondentDetailPage /></S> },
      { path: '/admin/surveys', element: <S><AdminSurveysPage /></S> },
      { path: '/admin/surveys/:id', element: <S><AdminSurveyDetailPage /></S> },
      { path: '/admin/payouts', element: <S><AdminPayoutsPage /></S> },
      { path: '/admin/fraud', element: <S><AdminFraudPage /></S> },
      { path: '/admin/fraud/:id', element: <S><AdminFraudDetailPage /></S> },
    ],
  },

  // ── Catch-all ──────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
