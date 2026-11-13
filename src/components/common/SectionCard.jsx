import { cn } from '@/utils/cn'

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[14px] font-bold tracking-[-0.015em] text-[var(--text)] sm:text-[15px]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-subtle sm:text-xs">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'px-5 pb-5 sm:px-6 sm:pb-6', bodyClassName)}>{children}</div>
    </section>
  )
}

export function InfoRow({ icon: Icon, label, value, className = '', href, children }) {
  const content = (
    <>
      {Icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-3)]">
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold tracking-wide text-subtle uppercase">{label}</p>
        <div className="mt-0.5 text-[13px] font-medium break-words text-[var(--text)]">
          {children || value || '—'}
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          'flex items-start gap-3 rounded-xl py-1 transition-opacity hover:opacity-75',
          className,
        )}
      >
        {content}
      </a>
    )
  }

  return <div className={cn('flex items-start gap-3 py-1', className)}>{content}</div>
}
