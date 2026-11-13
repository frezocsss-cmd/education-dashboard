import { MONTHS_SHORT, MONTHS_UZ } from './constants'

export function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function formatNumber(value) {
  const number = Math.round(toNumber(value))
  return new Intl.NumberFormat('ru-RU').format(number)
}

export function formatCurrency(value, { suffix = "so'm", compact = false } = {}) {
  if (compact) {
    return `${formatCompact(value)} ${suffix}`
  }
  return `${formatNumber(value)} ${suffix}`
}

export function formatCompact(value) {
  const number = Math.abs(toNumber(value))
  const sign = toNumber(value) < 0 ? '-' : ''
  if (number >= 1_000_000_000) {
    return `${sign}${trimZero(number / 1_000_000_000)} mlrd`
  }
  if (number >= 1_000_000) {
    return `${sign}${trimZero(number / 1_000_000)} mln`
  }
  if (number >= 1_000) {
    return `${sign}${trimZero(number / 1_000)} ming`
  }
  return `${sign}${Math.round(number)}`
}

function trimZero(value) {
  return value.toFixed(1).replace(/\.0$/, '')
}

export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const [datePart] = String(value).split('T')
  const parts = datePart.split('-').map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return new Date(parts[0], parts[1] - 1, parts[2])
}

export function formatDate(value, { withYear = true, shortMonth = true } = {}) {
  const date = parseDate(value)
  if (!date) return '—'
  const month = (shortMonth ? MONTHS_SHORT : MONTHS_UZ)[date.getMonth()]
  return withYear
    ? `${date.getDate()} ${month.toLowerCase()}, ${date.getFullYear()}`
    : `${date.getDate()} ${month.toLowerCase()}`
}

export function formatDateFull(value) {
  const date = parseDate(value)
  if (!date) return '—'
  return `${date.getDate()}-${MONTHS_UZ[date.getMonth()].toLowerCase()}, ${date.getFullYear()}`
}

export function formatDateNumeric(value) {
  const date = parseDate(value)
  if (!date) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function toISODate(date) {
  const d = parseDate(date) || new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function monthKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) return value
  const date = parseDate(value) || new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key, { short = false } = {}) {
  if (!key) return '—'
  const [year, month] = key.split('-').map(Number)
  if (!year || !month) return key
  const names = short ? MONTHS_SHORT : MONTHS_UZ
  return `${names[month - 1]} ${year}`
}

export function addMonths(date, amount) {
  const base = parseDate(date) || new Date()
  return new Date(base.getFullYear(), base.getMonth() + amount, 1)
}

export function lastNMonths(count, endDate = new Date()) {
  const end = parseDate(endDate) || new Date()
  const months = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(end.getFullYear(), end.getMonth() - i, 1)
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS_SHORT[date.getMonth()],
      fullLabel: `${MONTHS_UZ[date.getMonth()]} ${date.getFullYear()}`,
      date,
    })
  }
  return months
}

export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return '—'
  let local = digits
  if (local.startsWith('998')) local = local.slice(3)
  if (local.length === 9) {
    return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`
  }
  return String(value)
}

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('998')) return `+${digits}`
  if (digits.length === 9) return `+998${digits}`
  return digits ? `+${digits}` : ''
}

export function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function getInitials(firstName = '', lastName = '') {
  const parts = `${firstName} ${lastName}`.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const AVATAR_GRADIENTS = [
  ['#8b5cf6', '#6366f1'],
  ['#0ea5e9', '#2563eb'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#0d9488'],
  ['#ec4899', '#db2777'],
  ['#6366f1', '#4338ca'],
  ['#14b8a6', '#0284c7'],
  ['#f43f5e', '#be123c'],
]

export function avatarGradient(seed = '') {
  let hash = 0
  const text = String(seed)
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  const pair = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`
}

export function relativeTime(value) {
  const date = parseDate(value)
  if (!date) return '—'
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'hozir'
  if (minutes < 60) return `${minutes} daqiqa oldin`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'kecha'
  if (days < 30) return `${days} kun oldin`
  return formatDate(value)
}

export function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return 0
  const today = parseDate(new Date())
  today.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / 86400000)
}

export function pluralUz(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}
