import { HiOutlineInbox } from 'react-icons/hi2'
import { cn } from '@/utils/cn'

export default function EmptyState({
  icon: Icon = HiOutlineInbox,
  title = "Hozircha ma'lumot yo'q",
  description = "Bu bo'limda hali yozuvlar mavjud emas.",
  action,
  className = '',
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-10' : 'py-16',
        className,
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-brand-500/20 blur-xl dark:bg-brand-500/10" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-brand-500 shadow-sm">
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="text-[15px] font-bold tracking-tight text-[var(--text)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
