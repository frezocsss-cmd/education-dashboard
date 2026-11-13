import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

const CURRENT_YEAR = new Date().getFullYear()

export default function DashboardLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]',
        )}
      >
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1640px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <footer className="px-4 pb-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-1.5 border-t border-[var(--border)] pt-4 text-[10.5px] text-subtle sm:flex-row">
            <p>© {CURRENT_YEAR} Nexus Education. Barcha huquqlar himoyalangan.</p>
            <p>
              Boshqaruv paneli <span className="font-semibold text-[var(--text-3)]">v1.0</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
