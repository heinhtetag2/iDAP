import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, BarChart2, CreditCard, Settings, X, PlusCircle, Building2, Bell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { ROUTES } from '@/shared/config/routes'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: ROUTES.COMPANY_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.COMPANY_SURVEYS, icon: FileText, label: 'Surveys' },
  { to: ROUTES.COMPANY_ANALYTICS, icon: BarChart2, label: 'Analytics' },
  { to: ROUTES.COMPANY_BILLING, icon: CreditCard, label: 'Billing & Credits' },
  { to: ROUTES.COMPANY_NOTIFICATIONS, icon: Bell, label: 'Notifications' },
  { to: ROUTES.COMPANY_SETTINGS, icon: Settings, label: 'Settings' },
]

export function SidebarCompany({ isOpen, onClose }: SidebarProps) {
  const user = useCompanyAuthStore((s) => s.user)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-indigo-950 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-indigo-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">i</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm">iDap</span>
              <span className="text-indigo-400 text-xs ml-1">Business</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-indigo-800">
            <X className="h-5 w-5 text-indigo-300" />
          </button>
        </div>

        {/* Company info */}
        {user && (
          <div className="px-4 py-3 border-b border-indigo-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-700">
                <Building2 className="h-5 w-5 text-indigo-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.company_name}</p>
                <span className={cn(
                  'inline-block text-xs px-1.5 py-0.5 rounded-full font-medium capitalize',
                  user.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-400' :
                  user.plan === 'growth' ? 'bg-indigo-500/20 text-indigo-300' :
                  'bg-white/10 text-white/50'
                )}>
                  {user.plan}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick action */}
        <div className="px-3 py-3 border-b border-indigo-800">
          <NavLink
            to={ROUTES.COMPANY_SURVEY_NEW}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            New Survey
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Credits balance */}
        {user && (
          <div className="p-4 border-t border-indigo-800">
            <p className="text-xs text-indigo-400 mb-1">Available Credits</p>
            <p className="text-lg font-bold text-white">
              ₮{user.credits_balance.toLocaleString()}
            </p>
            <NavLink
              to={ROUTES.COMPANY_BILLING}
              onClick={onClose}
              className="text-xs text-indigo-400 hover:text-indigo-200 mt-1 inline-block"
            >
              Buy more →
            </NavLink>
          </div>
        )}
      </aside>
    </>
  )
}
