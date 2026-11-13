import { cn } from '@/utils/cn'

export function Skeleton({ className = '' }) {
  return <div className={cn('shimmer rounded-lg', className)} />
}

export function StatCardsSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="flex items-start justify-between">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-7 w-24" />
          <Skeleton className="mt-2 h-3.5 w-32" />
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 6, height = 'h-[15.5rem]' }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn('card flex flex-col gap-4 p-5', height)}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
          <div className="mt-auto flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="flex gap-6 bg-[var(--surface-2)] px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-6 border-t border-[var(--border)] px-4 py-4"
        >
          <Skeleton className="size-8 rounded-full" />
          {Array.from({ length: columns - 1 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Skeleton className="size-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
        <div className="card space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className="card p-5 sm:p-6">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-2 h-3.5 w-64" />
      <div className={cn('mt-6 flex items-end gap-2', height)}>
        {[45, 70, 55, 85, 62, 95, 74, 58].map((value, index) => (
          <div key={index} className="flex flex-1 flex-col justify-end gap-2">
            <Skeleton className="w-full rounded-t-lg" style={{ height: `${value}%` }} />
            <Skeleton className="h-2.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
