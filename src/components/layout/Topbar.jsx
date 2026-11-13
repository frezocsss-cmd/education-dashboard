import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineChevronDown,
  HiOutlineCog6Tooth,
  HiOutlineCommandLine,
  HiOutlineMagnifyingGlass,
  HiOutlineMoon,
  HiOutlinePower,
  HiOutlineSun,
  HiOutlineUserCircle,
} from 'react-icons/hi2'
import { pageMeta, pageTitles } from '@/config/navigation'
import { useThemeStore } from '@/store/themeStore'
import { useAuth } from '@/hooks/useAuth'
import { confirm } from '@/store/confirmStore'
import { toast } from '@/store/toastStore'
import { ROUTES } from '@/routes/paths'
import Avatar from '@/components/common/Avatar'
import Dropdown, { DropdownItem } from '@/components/common/Dropdown'
import NotificationsPanel from './NotificationsPanel'
import GlobalSearch from './GlobalSearch'

function resolveMeta(pathname) {
  if (pageMeta[pathname]) return { ...pageMeta[pathname], detail: false }
  const base = `/${pathname.split('/')[1] || ''}`
  const meta = pageMeta[base] || { title: 'Sahifa', breadcrumb: ['Sahifa'] }
  const detailTitle = pageTitles[base] || meta.title
  return { title: detailTitle, breadcrumb: [...meta.breadcrumb, detailTitle], detail: true }
}

export default function Topbar({ onOpenSidebar }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const [searchOpen, setSearchOpen] = useState(false)

  const meta = useMemo(() => resolveMeta(location.pathname), [location.pathname])
  const breadcrumb = ['Boshqaruv paneli', ...meta.breadcrumb]

  useEffect(() => {
    document.title = `${meta.title} · Nexus Education`
  }, [meta.title])

  useEffect(() => {
    function handleKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  async function handleLogout(close) {
    close?.()
    const approved = await confirm({
      title: 'Tizimdan chiqish',
      description: "Hisobingizdan chiqmoqchimisiz? Qayta kirish uchun telefon raqam va parol kerak bo'ladi.",
      confirmLabel: 'Chiqish',
      tone: 'danger',
    })
    if (!approved) return
    await logout()
    toast.info('Tizimdan chiqdingiz', "Xavfsiz ishlash uchun seans yakunlandi.")
  }

  return (
    <>
      <header className="glass-bar sticky top-0 z-30 border-b border-[var(--border)]">
        <div className="flex h-[72px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="icon-btn shrink-0 lg:hidden"
            aria-label="Menyuni ochish"
          >
            <HiOutlineCommandLine className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 sm:flex">
              {breadcrumb.map((item, index) => (
                <span key={`${item}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <span className="text-[10px] text-[var(--text-3)]">/</span>}
                  <span
                    className={
                      index === breadcrumb.length - 1
                        ? 'text-[10.5px] font-semibold text-[var(--text-2)]'
                        : 'text-[10.5px] font-medium text-[var(--text-3)]'
                    }
                  >
                    {item}
                  </span>
                </span>
              ))}
            </nav>
            <h1 className="truncate text-[15px] font-extrabold tracking-[-0.025em] text-[var(--text)] sm:mt-0.5 sm:text-base">
              {meta.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden w-56 items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-left text-[12px] font-medium text-[var(--text-3)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] md:flex xl:w-64"
              aria-label="Qidirish"
            >
              <HiOutlineMagnifyingGlass className="size-4 shrink-0" />
              <span className="flex-1 truncate">Qidirish...</span>
              <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[9.5px] font-semibold">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="icon-btn md:hidden"
              aria-label="Qidirish"
            >
              <HiOutlineMagnifyingGlass className="size-[18px]" />
            </button>

            <NotificationsPanel />

            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn relative overflow-hidden"
              aria-label={theme === 'dark' ? 'Kunduzgi rejimga o\u2018tish' : 'Tungi rejimga o\u2018tish'}
              title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
            >
              {theme === 'dark' ? (
                <HiOutlineSun className="size-[18px]" />
              ) : (
                <HiOutlineMoon className="size-[18px]" />
              )}
            </button>

            <div className="mx-1 hidden h-6 w-px bg-[var(--border)] sm:block" />

            <Dropdown
              align="right"
              panelClassName="w-64"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors hover:bg-[var(--surface-3)]"
                  aria-label="Administrator menyusi"
                >
                  <Avatar
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    name={user?.name}
                    size="sm"
                    status="online"
                  />
                  <span className="hidden min-w-0 text-left lg:block">
                    <span className="block max-w-[120px] truncate text-[12px] font-bold text-[var(--text)]">
                      {user?.name}
                    </span>
                    <span className="block text-[10px] text-subtle">{user?.role}</span>
                  </span>
                  <HiOutlineChevronDown className="hidden size-3.5 text-[var(--text-3)] lg:block" />
                </button>
              }
            >
              {({ close }) => (
                <>
                  <div className="mb-1 flex items-center gap-2.5 rounded-xl bg-[var(--surface-2)] p-2.5">
                    <Avatar
                      firstName={user?.firstName}
                      lastName={user?.lastName}
                      name={user?.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                        {user?.name}
                      </p>
                      <p className="truncate text-[10.5px] text-subtle">{user?.phone}</p>
                    </div>
                  </div>
                  <DropdownItem
                    icon={HiOutlineUserCircle}
                    onClick={() => {
                      close()
                      navigate(ROUTES.settings)
                    }}
                  >
                    Mening profilim
                  </DropdownItem>
                  <DropdownItem
                    icon={HiOutlineCog6Tooth}
                    onClick={() => {
                      close()
                      navigate(ROUTES.settings)
                    }}
                  >
                    Administrator sozlamalari
                  </DropdownItem>
                  <div className="my-1 h-px bg-[var(--border)]" />
                  <DropdownItem
                    icon={HiOutlinePower}
                    danger
                    onClick={() => handleLogout(close)}
                  >
                    Tizimdan chiqish
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </div>
      </header>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  )
}
