import { memo } from 'react'
import { HiArrowDownRight, HiArrowUpRight, HiMinus } from 'react-icons/hi2'
import { cn } from '@/utils/cn'
import { Skeleton } from './Skeleton'

const TONES = {
  brand: {
    icon: 'bg-brand-50 text-brand-600 ring-brand-600/10 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
    glow: 'from-brand-500/12',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 ring-violet-600/10 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
    glow: 'from-violet-500/12',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    glow: 'from-emerald-500/12',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    glow: 'from-amber-500/12',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
    glow: 'from-rose-500/12',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-600 ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
    glow: 'from-sky-500/12',
  },
}

function TrendPill({ value, direction = 'up', suffix = '%' }) {
  if (value === null || value === undefined) return null
  const isUp = direction === 'up'
  const isFlat = direction === 'flat'
  const Icon = isFlat ? HiMinus : isUp ? HiArrowUpRight : HiArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold',
        isFlat
          ? 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
          : isUp
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
      )}
    >
      <Icon className="size-3" />
      {value}
      {suffix}
    </span>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  trend,
  loading = false,
  className = '',
  onClick,
}) {
  const meta = TONES[tone] || TONES.brand
  const Wrapper = onClick ? 'button' : 'div'

  if (loading) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="flex items-start justify-between">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-5 h-7 w-24" />
        <Skeleton className="mt-2 h-3.5 w-32" />
      </div>
    )
  }

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'card group relative overflow-hidden p-5 text-left transition-all duration-300',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100',
          meta.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-xl ring-1 ring-inset',
            meta.icon,
          )}
        >
          {Icon && <Icon className="size-5" />}
        </div>
        {trend && <TrendPill {...trend} />}
      </div>
      <p className="relative mt-4 text-[1.6rem] leading-none font-extrabold tracking-[-0.04em] text-[var(--text)]">
        {value}
      </p>
      <div className="relative mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <p className="text-[12.5px] font-semibold text-[var(--text-2)]">{label}</p>
        {hint && (
          <>
            <span className="text-[var(--text-3)]">·</span>
            <p className="text-[11.5px] text-subtle">{hint}</p>
          </>
        )}
      </div>
    </Wrapper>
  )
}

export default memo(StatCard)
export { TrendPill }
