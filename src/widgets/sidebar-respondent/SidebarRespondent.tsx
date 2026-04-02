import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Wallet, Bell, Settings, X, ClipboardList, Users } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/shared/model/authStore'
import { ROUTES } from '@/shared/config/routes'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: ROUTES.FEED, icon: LayoutGrid, labelKey: 'nav:feed' },
  { to: ROUTES.SURVEY_HISTORY, icon: ClipboardList, labelKey: 'nav:surveyHistory' },
  { to: ROUTES.WALLET, icon: Wallet, labelKey: 'nav:wallet' },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, labelKey: 'nav:notifications' },
  { to: ROUTES.SETTINGS, icon: Settings, labelKey: 'nav:settings' },
]

const TRUST_LABELS = ['', 'New', 'Verified', 'Trusted', 'Premium', 'Partner']

export function SidebarRespondent({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const profileScore = user?.profile_score ?? 0
  const trustLevel = user?.trust_level ?? 1

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-sky-950 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sky-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">iDap</span>
              <span className="text-sky-400 text-xs ml-1">Respondent</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sky-800">
            <X className="h-5 w-5 text-sky-300" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-sky-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-700 text-sm font-bold text-white">
                {user.full_name?.charAt(0) ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <span className="text-xs text-sky-400">
                  Trust Lv.{trustLevel} · {TRUST_LABELS[trustLevel] ?? 'New'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-800 text-white'
                    : 'text-sky-300 hover:bg-sky-900 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Profile completion */}
        <div className="p-4 border-t border-sky-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-sky-400">{t('nav:profileCompletion')}</p>
            <p className="text-xs font-semibold text-sky-300">{profileScore}%</p>
          </div>
          <div className="h-1.5 rounded-full bg-sky-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400 transition-all"
              style={{ width: `${profileScore}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-sky-400">Platform online</p>
          </div>
        </div>
      </aside>
    </>
  )
}
