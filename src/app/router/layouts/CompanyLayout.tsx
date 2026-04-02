import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Menu, Bell, LogOut, ChevronDown, LayoutGrid } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { SidebarCompany } from '@/widgets/sidebar-company/SidebarCompany'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { ROUTES } from '@/shared/config/routes'

export function CompanyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useCompanyAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.COMPANY_LOGIN)
  }

  return (
    <div className="flex h-screen bg-surface-secondary overflow-hidden">
      <SidebarCompany isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-text-secondary" />
          </button>

          <div className="hidden lg:flex items-center">
            <Link to="/" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-gray-50 border border-transparent hover:border-border transition-all">
              <LayoutGrid className="h-3.5 w-3.5" />
              Switch portal
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5 text-text-secondary" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-50 border border-border transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {user?.full_name.charAt(0) ?? 'C'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-text-primary leading-none">{user?.full_name}</p>
                  <p className="text-xs text-text-muted leading-none mt-0.5">{user?.company_name}</p>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-white shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-text-primary">{user?.email}</p>
                    <p className="text-xs text-text-muted capitalize">{user?.role} · {user?.plan}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
