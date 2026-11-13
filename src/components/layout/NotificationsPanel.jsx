import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiBellAlert,
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineBell,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentCheck,
  HiOutlineRectangleGroup,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import Dropdown from '@/components/common/Dropdown'
import { Skeleton } from '@/components/common/Skeleton'
import { useCollection } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { relativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const TYPE_ICONS = {
  payment: HiOutlineBanknotes,
  student: HiOutlineAcademicCap,
  event: HiOutlineCalendarDays,
  group: HiOutlineRectangleGroup,
  attendance: HiOutlineClipboardDocumentCheck,
  system: HiOutlineSparkles,
}

const TYPE_TONES = {
  payment: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  student: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
  event: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  group: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  attendance: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  system: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
}

export default function NotificationsPanel() {
  const { data, loading, reload } = useCollection('notifications')
  const [marking, setMarking] = useState(false)
  const navigate = useNavigate()

  const notifications = useMemo(
    () => [...data].sort((a, b) => (String(a.date) < String(b.date) ? 1 : -1)),
    [data],
  )
  const unread = notifications.filter((item) => !item.read)

  async function markAllRead(close) {
    if (!unread.length) {
      close?.()
      return
    }
    setMarking(true)
    try {
      await Promise.all(unread.map((item) => api.patch('notifications', item.id, { read: true })))
      toast.success("Bildirishnomalar o'qilgan deb belgilandi", `${unread.length} ta yangilik ko'rildi.`)
      reload()
      close?.()
    } catch (error) {
      toast.error('Xatolik yuz berdi', error.message)
    } finally {
      setMarking(false)
    }
  }

  async function openNotification(notification, close) {
    close?.()
    if (!notification.read) {
      try {
        await api.patch('notifications', notification.id, { read: true })
        reload()
      } catch {
        /* navigatsiyaga to'sqinlik qilmaymiz */
      }
    }
    if (notification.link) navigate(notification.link)
  }

  return (
    <Dropdown
      align="right"
      panelClassName="w-[calc(100vw-2rem)] max-w-[380px] p-0"
      trigger={
        <button
          type="button"
          className="icon-btn relative"
          aria-label={`Bildirishnomalar${unread.length ? `, ${unread.length} ta o'qilmagan` : ''}`}
          title="Bildirishnomalar"
        >
          <HiOutlineBell className="size-[18px]" />
          {unread.length > 0 && (
            <span className="absolute top-1.5 right-1.5 flex min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white ring-2 ring-[var(--surface)]">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </button>
      }
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-[13px] font-bold text-[var(--text)]">Bildirishnomalar</p>
              <p className="text-[10.5px] text-subtle">
                {unread.length ? `${unread.length} ta o'qilmagan` : "Hammasi o'qilgan"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead(close)}
              disabled={marking || !unread.length}
              className="flex items-center gap-1 text-[10.5px] font-semibold text-brand-600 transition-opacity hover:opacity-75 disabled:opacity-40 dark:text-brand-300"
            >
              <HiOutlineCheckCircle className="size-3.5" />
              {marking ? 'Saqlanmoqda...' : 'Barchasini o‘qish'}
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto p-1.5">
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-2.5">
                    <Skeleton className="size-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-3)]">
                  <HiBellAlert className="size-5" />
                </div>
                <p className="mt-2.5 text-[12.5px] font-semibold text-[var(--text)]">
                  Bildirishnomalar yo'q
                </p>
                <p className="mt-0.5 text-[11px] text-subtle">Yangi xabarlar shu yerda ko'rinadi.</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => {
                const Icon = TYPE_ICONS[notification.type] || HiOutlineSparkles
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification, close)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[var(--surface-3)]',
                      !notification.read && 'bg-brand-50/50 dark:bg-brand-500/[0.06]',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                        TYPE_TONES[notification.type] || TYPE_TONES.system,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-1.5">
                        <span className="line-clamp-1 flex-1 text-[12px] font-semibold text-[var(--text)]">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-500" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-relaxed text-muted">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[9.5px] font-medium text-subtle">
                        {relativeTime(notification.date)}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <div className="border-t border-[var(--border)] p-2">
            <button
              type="button"
              onClick={() => {
                close()
                navigate('/')
              }}
              className="w-full rounded-lg py-1.5 text-center text-[11px] font-semibold text-brand-600 transition-colors hover:bg-[var(--surface-3)] dark:text-brand-300"
            >
              Boshqaruv paneliga o'tish
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  )
}
