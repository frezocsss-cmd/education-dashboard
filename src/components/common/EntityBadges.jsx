import Badge from './Badge'
import {
  ATTENDANCE_STATUS,
  GROUP_STATUS,
  LEVELS,
  PAYMENT_STATUS,
  PERSON_STATUS,
} from '@/utils/constants'

const LEVEL_TONES = {
  "Boshlang'ich": 'sky',
  "O'rta": 'violet',
  Yuqori: 'brand',
  IELTS: 'amber',
}

export function LevelBadge({ level, className = '' }) {
  if (!level) return null
  return (
    <Badge tone={LEVEL_TONES[level] || 'slate'} dot className={className}>
      {level}
    </Badge>
  )
}

export function PaymentStatusBadge({ status, className = '', short = false }) {
  const meta = PAYMENT_STATUS[status] || PAYMENT_STATUS.unpaid
  return (
    <Badge tone={meta.tone} dot className={className}>
      {short ? meta.short : meta.label}
    </Badge>
  )
}

export function PersonStatusBadge({ status, className = '' }) {
  const meta = PERSON_STATUS[status] || PERSON_STATUS.active
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}

export function GroupStatusBadge({ status, className = '' }) {
  const meta = GROUP_STATUS[status] || GROUP_STATUS.active
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}

export function AttendanceBadge({ status, className = '' }) {
  const meta = ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.absent
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}

export function PaymentMethodBadge({ method }) {
  if (!method) return <span className="text-xs text-subtle">—</span>
  const labels = {
    cash: 'Naqd',
    card: 'Karta',
    transfer: "O'tkazma",
    online: 'Online',
  }
  return <span className="chip">{labels[method] || method}</span>
}

export const LEVEL_OPTIONS = LEVELS
