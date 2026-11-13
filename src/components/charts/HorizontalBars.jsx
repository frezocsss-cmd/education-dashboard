import { memo } from 'react'
import { cn } from '@/utils/cn'

/**
 * Gorizontal progress satrlari — kurslar bo'yicha daromad, guruhlar davomati uchun.
 */
function HorizontalBars({
  data = [],
  formatValue = (value) => String(value),
  className = '',
  color = '#6d34ec',
  suffix = '',
}) {
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1)

  if (!data.length) {
    return <p className="py-8 text-center text-xs text-subtle">Ma'lumot mavjud emas</p>
  }

  return (
    <div className={cn('space-y-4', className)}>
      {data.map((item) => {
        const value = Number(item.value) || 0
        const width = Math.max((value / max) * 100, 2)
        return (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="truncate text-[12px] font-semibold text-[var(--text-2)]">
                {item.label}
              </span>
              <span className="shrink-0 text-[12px] font-bold text-[var(--text)]">
                {formatValue(value)}
                {suffix}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${width}%`,
                  background: item.color || color,
                }}
              />
            </div>
            {item.caption && (
              <p className="mt-1 text-[10.5px] text-subtle">{item.caption}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default memo(HorizontalBars)
