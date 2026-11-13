import { monthKey, parseDate } from './format'
import { ATTENDANCE_STATUS, LEVELS } from './constants'

export function sumBy(items = [], selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0)
}

export function countBy(items = [], selector) {
  return items.reduce((acc, item) => {
    const key = selector(item)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

export function paymentPaidAmount(payment) {
  if (!payment) return 0
  if (payment.status === 'paid') return Number(payment.amount || 0)
  return Number(payment.paidAmount || 0)
}

export function paymentTotals(payments = []) {
  const billed = sumBy(payments, (item) => item.amount)
  const paid = sumBy(payments, paymentPaidAmount)
  return {
    billed,
    paid,
    debt: Math.max(billed - paid, 0),
    count: payments.length,
    paidCount: payments.filter((item) => item.status === 'paid').length,
    partialCount: payments.filter((item) => item.status === 'partial').length,
    unpaidCount: payments.filter((item) => item.status === 'unpaid').length,
  }
}

export function filterPaymentsByMonth(payments = [], key) {
  return payments.filter((payment) => monthKey(payment.month || payment.date) === key)
}

export function monthlyRevenueSeries(payments = [], months = []) {
  return months.map((month) => {
    const monthPayments = filterPaymentsByMonth(payments, month.key)
    return {
      key: month.key,
      label: month.label,
      fullLabel: month.fullLabel,
      value: sumBy(monthPayments, paymentPaidAmount),
      billed: sumBy(monthPayments, (item) => item.amount),
      count: monthPayments.length,
    }
  })
}

export function studentGrowthSeries(students = [], months = []) {
  let cumulative = 0
  const firstMonth = months[0]?.key || '0000-00'
  // Boshlang'ich nuqta: tanlangan davrdan oldin qo'shilgan o'quvchilar.
  cumulative = students.filter((student) => {
    const key = monthKey(student.enrollmentDate)
    return key < firstMonth
  }).length

  return months.map((month) => {
    const joined = students.filter((student) => monthKey(student.enrollmentDate) === month.key).length
    cumulative += joined
    return {
      key: month.key,
      label: month.label,
      fullLabel: month.fullLabel,
      value: cumulative,
      joined,
    }
  })
}

export function attendanceStats(records = []) {
  const present = records.filter((record) => record.status === 'present').length
  const late = records.filter((record) => record.status === 'late').length
  const absent = records.filter((record) => record.status === 'absent').length
  const total = present + late + absent
  const attended = present + late
  return {
    present,
    late,
    absent,
    total,
    attended,
    rate: total ? Math.round((attended / total) * 100) : 0,
    strictRate: total ? Math.round((present / total) * 100) : 0,
  }
}

export function groupAttendanceStats(records = [], groupId) {
  return attendanceStats(records.filter((record) => String(record.groupId) === String(groupId)))
}

export function attendanceStatusLabel(status) {
  return ATTENDANCE_STATUS[status]?.label || status
}

export function percent(part, total) {
  if (!total) return 0
  return Math.round((Number(part) / Number(total)) * 100)
}

export function trend(current, previous) {
  const currentValue = Number(current) || 0
  const previousValue = Number(previous) || 0
  if (!previousValue) {
    return { value: currentValue > 0 ? 100 : 0, direction: currentValue > 0 ? 'up' : 'flat' }
  }
  const diff = ((currentValue - previousValue) / previousValue) * 100
  return {
    value: Math.abs(Math.round(diff)),
    direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat',
  }
}

export function latestDate(records = [], key = 'date') {
  return records.reduce((latest, record) => {
    const value = record[key]
    if (!value) return latest
    if (!latest || value > latest) return value
    return latest
  }, '')
}

export function attendanceByDate(records = []) {
  const map = new Map()
  records.forEach((record) => {
    const key = record.date
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(record)
  })
  return Array.from(map.entries())
    .map(([date, items]) => ({ date, ...attendanceStats(items) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function levelIndex(level) {
  const index = LEVELS.indexOf(level)
  return index === -1 ? 0 : index
}

export function nextLevel(level) {
  const index = levelIndex(level)
  return LEVELS[Math.min(index + 1, LEVELS.length - 1)]
}

export function daysUntil(dateValue) {
  const date = parseDate(dateValue)
  if (!date) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86400000)
}

export function upcomingEvents(events = [], count = 4) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return events
    .filter((event) => {
      const date = parseDate(event.date)
      return date && date >= today
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, count)
}

export function buildNameMap(items = []) {
  return new Map(items.map((item) => [String(item.id), item]))
}

export function fullName(person = {}) {
  return `${person.firstName || ''} ${person.lastName || ''}`.trim() || '—'
}

export function courseStudentCount(students = [], courseId) {
  return students.filter((student) => String(student.courseId) === String(courseId)).length
}

export function groupStudentCount(students = [], groupId) {
  return students.filter((student) => String(student.groupId) === String(groupId)).length
}

export function teacherGroups(groups = [], teacherId) {
  return groups.filter((group) => String(group.teacherId) === String(teacherId))
}
