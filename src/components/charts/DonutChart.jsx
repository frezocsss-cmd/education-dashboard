import { memo, useMemo } from 'react'
import { cn } from '@/utils/cn'

/**
 * Donut diagramma + izohlar ro'yxati. Ma'lumot bo'lmasa xushmuomala bo'sh holat ko'rsatadi.
 */
function DonutChart({
  data = [],
  size = 160,
  stroke = 16,
  centerLabel,
  centerValue,
  formatValue = (value) => String(value),
  className = '',
  legendClassName = '',
  showLegend = true,
}) {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [data],
  )
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const segments = useMemo(() => {
    const values = data.map((item) => Number(item.value) || 0)
    const sum = values.reduce((accumulator, value) => accumulator + value, 0) || 1
    return data.map((item, index) => {
      const portion = values[index] / sum
      const dash = portion * circumference
      const before = values.slice(0, index).reduce((accumulator, value) => accumulator + value, 0) / sum
      return {
        ...item,
        portion,
        dasharray: `${dash} ${circumference - dash}`,
        dashoffset: -before * circumference,
      }
    })
  }, [data, circumference])

  if (!total) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-4 border-dashed border-[var(--border)] text-xs text-subtle">
          0%
        </div>
        <p className="mt-3 text-xs text-subtle">Ma'lumot mavjud emas</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-[var(--surface-3)]"
            strokeWidth={stroke}
          />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={segment.dasharray}
              strokeDashoffset={segment.dashoffset}
              style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              <title>{`${segment.label}: ${formatValue(segment.value)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.35rem] font-extrabold tracking-tight text-[var(--text)]">
            {centerValue}
          </span>
          {centerLabel && (
            <span className="mt-0.5 max-w-[80%] text-center text-[9.5px] font-medium text-subtle">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {showLegend && (
        <div className={cn('w-full min-w-0 space-y-2.5', legendClassName)}>
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate text-[12px] font-medium text-[var(--text-2)]">
                  {segment.label}
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5">
                <span className="text-[12px] font-bold text-[var(--text)]">
                  {formatValue(segment.value)}
                </span>
                <span className="text-[10px] font-medium text-subtle">
                  {Math.round(segment.portion * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(DonutChart)
