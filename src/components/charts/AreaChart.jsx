import { useId, useMemo, useState } from 'react'
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

function smoothPath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`
  let path = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return path
}

/**
 * Silliq maydon (area) grafigi — hover tooltip bilan.
 */
export default function AreaChart({
  data = [],
  height = 250,
  color = '#6d34ec',
  formatValue = (value) => String(value),
  yFormat,
  className = '',
  emptyText = "Ma'lumot yo'q",
}) {
  const gradientId = `area-${useId().replace(/:/g, '')}`
  const [hover, setHover] = useState(null)

  const width = 680
  const padding = { top: 18, right: 14, bottom: 30, left: 48 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const { points, maxValue, ticks, areaPath, linePath } = useMemo(() => {
    const max = niceMax(Math.max(...data.map((item) => Number(item.value) || 0), 1))
    const len = Math.max(data.length - 1, 1)
    const pts = data.map((item, index) => ({
      x: padding.left + (index / len) * innerW,
      y: padding.top + innerH - ((Number(item.value) || 0) / max) * innerH,
      ...item,
    }))
    const line = smoothPath(pts)
    const area =
      pts.length > 1
        ? `${line} L${pts[pts.length - 1].x},${padding.top + innerH} L${pts[0].x},${padding.top + innerH} Z`
        : ''
    const tickList = Array.from({ length: 5 }, (_, index) => Math.round((max / 4) * index))
    return { points: pts, maxValue: max, ticks: tickList, areaPath: area, linePath: line }
  }, [data, height, innerH, innerW, padding.left, padding.top])

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

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = ((event.clientX - rect.left) / rect.width) * width
    const ratio = (relativeX - padding.left) / innerW
    const index = Math.round(ratio * (data.length - 1))
    setHover(Math.min(data.length - 1, Math.max(0, index)))
  }

  const active = hover !== null ? points[hover] : null

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="O'sish grafigi"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="55%" stopColor={color} stopOpacity="0.09" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

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

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <text
              x={point.x}
              y={height - 8}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
              fontSize="9.5"
              fontWeight="600"
              fill="var(--text-3)"
            >
              {point.label}
            </text>
            {hover === index && (
              <>
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={padding.top}
                  y2={padding.top + innerH}
                  stroke={color}
                  strokeOpacity="0.35"
                  strokeDasharray="3 4"
                />
                <circle cx={point.x} cy={point.y} r="5.5" fill={color} fillOpacity="0.18" />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3.2"
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth="2.5"
                />
              </>
            )}
          </g>
        ))}

        <rect
          x={padding.left}
          y={padding.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-pop)]"
          style={{
            left: `${Math.min(88, Math.max(12, (active.x / width) * 100))}%`,
            top: `${(active.y / height) * 100}%`,
          }}
        >
          <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
            {active.fullLabel || active.label}
          </p>
          <p className="mt-0.5 text-[13px] font-bold whitespace-nowrap text-[var(--text)]">
            {formatValue(active.value)}
          </p>
          {active.subLabel && (
            <p className="mt-0.5 text-[10px] text-muted">{active.subLabel}</p>
          )}
        </div>
      )}
    </div>
  )
}
