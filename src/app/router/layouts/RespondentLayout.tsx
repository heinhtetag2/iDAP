import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarRespondent } from '@/widgets/sidebar-respondent/SidebarRespondent'
import { Header } from '@/widgets/header/Header'

export function RespondentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <SidebarRespondent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl p-4 lg:p-6 xl:p-8 2xl:px-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
