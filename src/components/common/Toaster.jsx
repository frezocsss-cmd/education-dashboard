import { createPortal } from 'react-dom'
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/utils/cn'

const TYPES = {
  success: {
    icon: HiOutlineCheckCircle,
    ring: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: HiOutlineExclamationCircle,
    ring: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
  warning: {
    icon: HiOutlineExclamationCircle,
    ring: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  info: {
    icon: HiOutlineInformationCircle,
    ring: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400',
    bar: 'bg-sky-500',
  },
}

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return createPortal(
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-[200] flex flex-col items-center gap-2.5 sm:right-5 sm:left-auto sm:items-end">
      {toasts.map((toast) => {
        const meta = TYPES[toast.type] || TYPES.info
        const Icon = meta.icon
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 pr-10 shadow-[var(--shadow-pop)] animate-toast-in"
          >
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', meta.ring)}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] font-bold tracking-tight text-[var(--text)]">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="absolute top-2.5 right-2.5 rounded-md p-1 text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
              aria-label="Bildirishnomani yopish"
            >
              <HiOutlineXMark className="size-4" />
            </button>
            <span className={cn('absolute bottom-0 left-0 h-0.5 w-full opacity-60', meta.bar)} />
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
