import { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'

function niceMax(value) {
  if (!value || value <= 0) return 10
  const exponent = Math.floor(Math.log10(value))
  const base = 10 ** exponent
  const normalized = value / base
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return step * base
}

/**
 * Vertikal ustunli grafik — daromad, davomat kabi taqqoslamalar uchun.
 */
export default function BarChart({
  data = [],
  height = 250,
  color = '#6d34ec',
  formatValue = (value) => String(value),
  yFormat,
  className = '',
  emptyText = "Ma'lumot yo'q",
  accentLast = false,
}) {
  const [hover, setHover] = useState(null)
  const width = 680
  const padding = { top: 18, right: 14, bottom: 30, left: 48 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const { maxValue, ticks, barWidth } = useMemo(() => {
    const max = niceMax(Math.max(...data.map((item) => Number(item.value) || 0), 1))
    const tickList = Array.from({ length: 5 }, (_, index) => Math.round((max / 4) * index))
    const slot = innerW / Math.max(data.length, 1)
    return { maxValue: max, ticks: tickList, barWidth: Math.min(40, slot * 0.5) }
  }, [data, innerW])

  if (!data.length) {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-subtle', className)}
        style={{ height }}
      >
        {emptyText}
      </div>
    )
  }

  const slot = innerW / data.length

  return (
    <div className={cn('relative w-full', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img">
        {ticks.map((tick) => {
          const y = padding.top + innerH - (tick / maxValue) * innerH
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-[var(--border)]"
                strokeDasharray={tick === 0 ? undefined : '3 6'}
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9.5"
                fontWeight="600"
                fill="var(--text-3)"
              >
                {(yFormat || formatValue)(tick)}
              </text>
            </g>
          )
        })}

        {data.map((item, index) => {
          const value = Number(item.value) || 0
          const barHeight = Math.max((value / maxValue) * innerH, value > 0 ? 3 : 0)
          const x = padding.left + slot * index + (slot - barWidth) / 2
          const y = padding.top + innerH - barHeight
          const isActive = hover === index
          const fill = item.color || (accentLast && index === data.length - 1 ? '#8054f8' : color)
          return (
            <g
              key={`${item.label}-${index}`}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={padding.left + slot * index}
                y={padding.top}
                width={slot}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={Math.min(7, barWidth / 2)}
                fill={fill}
                fillOpacity={hover === null || isActive ? 1 : 0.45}
                style={{ transition: 'fill-opacity 0.18s ease' }}
              />
              <text
                x={padding.left + slot * index + slot / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="var(--text-3)"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[110%] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-pop)]"
          style={{
            left: `${Math.min(88, Math.max(12, ((padding.left + slot * hover + slot / 2) / width) * 100))}%`,
            top: `${
              ((padding.top +
                innerH -
                ((Number(data[hover].value) || 0) / maxValue) * innerH) /
                height) *
              100
            }%`,
          }}
        >
          <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
            {data[hover].fullLabel || data[hover].label}
          </p>
          <p className="mt-0.5 text-[13px] font-bold whitespace-nowrap text-[var(--text)]">
            {formatValue(data[hover].value)}
          </p>
        </div>
      )}
    </div>
  )
}
