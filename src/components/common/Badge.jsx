import { memo } from 'react'
import { cn } from '@/utils/cn'

const TONES = {
  brand:
    'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
  emerald:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber:
    'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  violet:
    'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
  slate:
    'bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10',
}

const DOTS = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  brand: 'bg-brand-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
}

function Badge({ tone = 'slate', children, dot = false, className = '', icon: Icon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        TONES[tone] || TONES.slate,
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', DOTS[tone] || DOTS.slate)} />}
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  )
}

export default memo(Badge)

export function ToneDot({ tone = 'emerald', className = '' }) {
  return <span className={cn('size-1.5 rounded-full', DOTS[tone] || DOTS.slate, className)} />
}
