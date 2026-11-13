import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * Yengil dropdown: trigger + panel. Panel ichidagi har qanday tugma `close()` ni chaqirishi mumkin.
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right',
  panelClassName = '',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <div onClick={() => setOpen((value) => !value)}>
        {typeof trigger === 'function' ? trigger(open) : trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-pop)] animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
          role="menu"
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ children, icon: Icon, onClick, danger = false, className = '' }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
        danger
          ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
          : 'text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]',
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {children}
    </button>
  )
}
