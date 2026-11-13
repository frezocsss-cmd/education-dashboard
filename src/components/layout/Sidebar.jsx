import { NavLink } from 'react-router-dom'
import { HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight, HiOutlineXMark } from 'react-icons/hi2'
import { navigation } from '@/config/navigation'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import Brand from './Brand'
import Avatar from '@/components/common/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/store/themeStore'

export default function Sidebar({ mobileOpen, onClose }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggle = useUiStore((state) => state.toggleSidebar)
  const { user } = useAuth()
  const theme = useThemeStore((state) => state.theme)

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Asosiy navigatsiya"
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-2 px-4">
          <Brand collapsed={false} size="md" className={cn(collapsed && 'lg:hidden')} />
          <button
            type="button"
            onClick={toggle}
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)] lg:flex"
            aria-label={collapsed ? 'Yon panelni ochish' : 'Yon panelni yig\u2018ish'}
            title={collapsed ? 'Yon panelni ochish' : "Yon panelni yig'ish"}
          >
            {collapsed ? (
              <HiOutlineChevronDoubleRight className="size-4" />
            ) : (
              <HiOutlineChevronDoubleLeft className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn icon-btn-sm lg:hidden"
            aria-label="Menyuni yopish"
          >
            <HiOutlineXMark className="size-5" />
          </button>
        </div>

        {collapsed && (
          <div className="mb-2 hidden justify-center lg:flex">
            <Brand collapsed size="sm" />
          </div>
        )}

        <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {navigation.map((section) => (
            <div key={section.label}>
              <p
                className={cn(
                  'mb-2 px-2.5 text-[9.5px] font-bold tracking-[0.16em] text-[var(--text-3)] uppercase transition-opacity',
                  collapsed && 'lg:opacity-0',
                )}
              >
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-semibold transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_6px_16px_-8px_rgba(109,52,236,0.8)]'
                            : 'text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'text-[var(--text-3)] group-hover:text-[var(--text)]',
                              collapsed && 'lg:mx-auto',
                            )}
                          >
                            <Icon className="size-[18px]" />
                          </span>
                          <span
                            className={cn(
                              'truncate transition-all duration-200',
                              collapsed && 'lg:w-0 lg:overflow-hidden lg:opacity-0',
                            )}
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] p-3">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5',
              collapsed && 'lg:justify-center lg:p-2',
            )}
          >
            <Avatar
              name={user?.name}
              size="sm"
              status="online"
              className={cn(collapsed && 'lg:mx-auto')}
            />
            <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <p className="truncate text-[12px] font-bold text-[var(--text)]">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate text-[10px] text-subtle">{user?.role || 'Administrator'}</p>
            </div>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                collapsed && 'lg:hidden',
              )}
            >
              <span className="size-1 rounded-full bg-emerald-500" />
              {theme === 'dark' ? 'Tungi' : 'Kunduzgi'}
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
