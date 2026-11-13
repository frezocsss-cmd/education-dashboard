import { memo } from 'react'
import { cn } from '@/utils/cn'
import { Skeleton } from './Skeleton'

const TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
}

function QuickStat({ label, value, icon: Icon, tone = 'brand', hint, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={cn('card flex items-center gap-3 p-4', className)}>
        <Skeleton className="size-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('card flex items-center gap-3 p-4', className)}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          TONES[tone] || TONES.brand,
        )}
      >
        {Icon && <Icon className="size-[18px]" />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[1.15rem] leading-tight font-extrabold tracking-[-0.03em] text-[var(--text)]">
          {value}
        </p>
        <p className="truncate text-[10.5px] font-medium text-subtle">
          {label}
          {hint ? ` · ${hint}` : ''}
        </p>
      </div>
    </div>
  )
}

export default memo(QuickStat)
