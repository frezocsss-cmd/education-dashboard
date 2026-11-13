import { HiOutlineChevronLeft } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export default function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel = 'Orqaga',
  badge,
  className = '',
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
          >
            <HiOutlineChevronLeft className="size-3.5" />
            {backLabel}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-[1.65rem]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
