import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HiOutlineXMark } from 'react-icons/hi2'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
}

/**
 * Premium modal: mobil qurilmada pastdan chiqadigan panel, desktopda markazlashgan oyna.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    function handleKey(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Oyna'}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-[var(--overlay)] backdrop-blur-[3px]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)] sm:max-h-[88dvh] sm:rounded-3xl',
          SIZES[size] || SIZES.md,
          'animate-scale-in',
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              {title && (
                <h3 className="text-[15px] font-bold tracking-tight text-[var(--text)] sm:text-base">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn icon-btn-sm -mt-1 -mr-1 shrink-0"
              aria-label="Yopish"
            >
              <HiOutlineXMark className="size-5" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
