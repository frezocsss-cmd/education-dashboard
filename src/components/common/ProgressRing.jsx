import { memo } from 'react'
import { cn } from '@/utils/cn'

function ProgressRing({
  value = 0,
  size = 96,
  stroke = 9,
  className = '',
  trackClass = 'text-[var(--surface-3)]',
  color = '#6d34ec',
  label,
  caption,
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tracking-tight text-[var(--text)]">
          {label ?? `${clamped}%`}
        </span>
        {caption && <span className="mt-0.5 text-[10px] font-medium text-subtle">{caption}</span>}
      </div>
    </div>
  )
}

export default memo(ProgressRing)
