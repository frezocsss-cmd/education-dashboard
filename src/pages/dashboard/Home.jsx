import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineMapPin,
  HiOutlinePlus,
  HiOutlineRectangleGroup,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineWallet,
} from 'react-icons/hi2'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import StatCard from '@/components/common/StatCard'
import ErrorState from '@/components/common/ErrorState'
import EmptyState from '@/components/common/EmptyState'
import { SectionCard } from '@/components/common/SectionCard'
import { ChartSkeleton, StatCardsSkeleton } from '@/components/common/Skeleton'
import Avatar from '@/components/common/Avatar'
import { PaymentStatusBadge } from '@/components/common/EntityBadges'
import AreaChart from '@/components/charts/AreaChart'
import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import { useCollections } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'
import {
  attendanceStats,
  daysUntil,
  filterPaymentsByMonth,
  fullName,
  monthlyRevenueSeries,
  paymentPaidAmount,
  paymentTotals,
  studentGrowthSeries,
  trend,
  upcomingEvents,
} from '@/utils/stats'
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateFull,
  formatNumber,
  lastNMonths,
  monthKey,
  monthLabel,
  parseDate,
  todayISO,
} from '@/utils/format'
import { ROUTES } from '@/routes/paths'

const RESOURCES = {
  students: 'students',
  teachers: 'teachers',
  parents: 'parents',
  groups: 'groups',
  courses: 'courses',
  payments: 'payments',
  attendance: 'attendance',
  events: 'events',
}

const EVENT_STYLES = {
  meeting: {
    label: "Yig'ilish",
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  },
  exam: {
    label: 'Imtihon',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  opening: {
    label: 'Ochilish',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  event: {
    label: 'Tadbir',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  },
  payment: {
    label: "To'lov",
    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  },
}

const MONTH_SHORT = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyn',
  'Iyl',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Xayrli tong'
  if (hour < 18) return 'Xayrli kun'
  return 'Xayrli kech'
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, loading, error, reload } = useCollections(RESOURCES)

  const students = data.students || []
  const teachers = data.teachers || []
  const parents = data.parents || []
  const groups = data.groups || []
  const courses = data.courses || []
  const payments = data.payments || []
  const attendance = data.attendance || []
  const events = data.events || []

  const months = useMemo(() => lastNMonths(6), [])
  const today = useMemo(() => new Date(), [])
  const currentMonth = monthKey(today)
  const previousMonth = months[months.length - 2]?.key || ''

  const studentMap = useMemo(
    () => new Map(students.map((student) => [String(student.id), student])),
    [students],
  )
  const groupMap = useMemo(
    () => new Map(groups.map((group) => [String(group.id), group])),
    [groups],
  )
  const courseMap = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course])),
    [courses],
  )

  const currentPayments = useMemo(
    () => filterPaymentsByMonth(payments, currentMonth),
    [payments, currentMonth],
  )
  const previousPayments = useMemo(
    () => filterPaymentsByMonth(payments, previousMonth),
    [payments, previousMonth],
  )
  const revenueTotals = useMemo(() => paymentTotals(currentPayments), [currentPayments])
  const previousTotals = useMemo(() => paymentTotals(previousPayments), [previousPayments])

  const currentAttendance = useMemo(
    () => attendance.filter((record) => monthKey(record.date) === currentMonth),
    [attendance, currentMonth],
  )
  const previousAttendance = useMemo(
    () => attendance.filter((record) => monthKey(record.date) === previousMonth),
    [attendance, previousMonth],
  )
  const attendanceSummary = useMemo(
    () => attendanceStats(currentAttendance),
    [currentAttendance],
  )
  const previousAttendanceSummary = useMemo(
    () => attendanceStats(previousAttendance),
    [previousAttendance],
  )

  const todaysAttendance = useMemo(
    () => attendance.filter((record) => record.date === todayISO()),
    [attendance],
  )
  const todaySummary = useMemo(() => attendanceStats(todaysAttendance), [todaysAttendance])

  const joinedThisMonth = useMemo(
    () => students.filter((student) => monthKey(student.enrollmentDate) === currentMonth).length,
    [students, currentMonth],
  )
  const joinedPreviousMonth = useMemo(
    () =>
      students.filter((student) => monthKey(student.enrollmentDate) === previousMonth).length,
    [students, previousMonth],
  )

  const revenueSeries = useMemo(() => monthlyRevenueSeries(payments, months), [payments, months])
  const growthSeries = useMemo(
    () =>
      studentGrowthSeries(students, months).map((item) => ({
        ...item,
        value: item.joined,
        subLabel: `${item.value} jami o'quvchi`,
      })),
    [students, months],
  )
  const attendanceSeries = useMemo(
    () =>
      months.map((month) => {
        const records = attendance.filter((record) => monthKey(record.date) === month.key)
        return {
          key: month.key,
          label: month.label,
          fullLabel: month.fullLabel,
          value: attendanceStats(records).rate,
          subLabel: `${records.length} dars yozuvi`,
        }
      }),
    [months, attendance],
  )

  const recentStudents = useMemo(
    () =>
      [...students]
        .sort((a, b) => String(b.enrollmentDate).localeCompare(String(a.enrollmentDate)))
        .slice(0, 5),
    [students],
  )

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, 5),
    [payments],
  )

  const eventsList = useMemo(() => upcomingEvents(events, 4), [events])

  const statusData = [
    { label: "To'langan", value: revenueTotals.paidCount, color: '#10b981' },
    { label: 'Qisman', value: revenueTotals.partialCount, color: '#f59e0b' },
    { label: "To'lanmagan", value: revenueTotals.unpaidCount, color: '#f43f5e' },
  ]

  const activeGroups = groups.filter((group) => group.status === 'active').length
  const activeTeachers = teachers.filter((teacher) => teacher.status === 'active').length
  const debtors = currentPayments.filter((payment) => payment.status !== 'paid').length
  const assistedParents = parents.filter((parent) => (parent.studentIds || []).length > 0).length

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Boshqaruv paneli" description="Markazning umumiy ko'rsatkichlari." />
        <ErrorState onRetry={reload} description={error} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting()}, ${user?.firstName || 'Administrator'}!`}
        description={`${formatDateFull(today)} — bugungi darslar, to'lovlar va muhim voqealar bir joyda.`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={HiOutlineChartBar}
              onClick={() => navigate(ROUTES.reports)}
            >
              Hisobotlar
            </Button>
            <Button
              variant="primary"
              icon={HiOutlinePlus}
              onClick={() => navigate(`${ROUTES.students}?new=1`)}
            >
              Yangi o'quvchi
            </Button>
          </>
        }
      />

      {loading ? (
        <>
          <StatCardsSkeleton count={8} />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ChartSkeleton />
            </div>
            <ChartSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Jami o'quvchilar"
              value={formatNumber(students.length)}
              hint={`${joinedThisMonth} yangi`}
              icon={HiOutlineAcademicCap}
              tone="brand"
              trend={trend(joinedThisMonth, joinedPreviousMonth)}
              onClick={() => navigate(ROUTES.students)}
            />
            <StatCard
              label="Faol guruhlar"
              value={groupMap.size ? activeGroups : 0}
              hint={`${groups.length} jami`}
              icon={HiOutlineRectangleGroup}
              tone="violet"
              onClick={() => navigate(ROUTES.groups)}
            />
            <StatCard
              label="O'qituvchilar"
              value={formatNumber(teachers.length)}
              hint={`${activeTeachers} faol`}
              icon={HiOutlineUsers}
              tone="sky"
              onClick={() => navigate(ROUTES.teachers)}
            />
            <StatCard
              label="Ota-onalar"
              value={formatNumber(parents.length)}
              hint={`${assistedParents} bog'langan`}
              icon={HiOutlineUserGroup}
              tone="emerald"
              onClick={() => navigate(ROUTES.parents)}
            />
            <StatCard
              label="Joriy oy tushumi"
              value={formatCurrency(revenueTotals.paid, { compact: true })}
              hint={monthLabel(currentMonth, { short: true })}
              icon={HiOutlineWallet}
              tone="emerald"
              trend={trend(revenueTotals.paid, previousTotals.paid)}
              onClick={() => navigate(ROUTES.payments)}
            />
            <StatCard
              label="Joriy oy qarzi"
              value={formatCurrency(revenueTotals.debt, { compact: true })}
              hint={`${debtors} qarzdor`}
              icon={HiOutlineBanknotes}
              tone={revenueTotals.debt > 0 ? 'rose' : 'emerald'}
              onClick={() => navigate(ROUTES.payments)}
            />
            <StatCard
              label="Oylik davomat"
              value={`${attendanceSummary.rate}%`}
              hint={`${attendanceSummary.total} yozuv`}
              icon={HiOutlineClock}
              tone={
                attendanceSummary.rate >= 85
                  ? 'emerald'
                  : attendanceSummary.rate >= 70
                    ? 'amber'
                    : 'rose'
              }
              trend={trend(attendanceSummary.rate, previousAttendanceSummary.rate)}
              onClick={() => navigate(ROUTES.attendance)}
            />
            <StatCard
              label="Bugungi davomat"
              value={todaySummary.total ? `${todaySummary.rate}%` : '—'}
              hint={todaySummary.total ? `${todaySummary.total} yozuv` : "hali belgilanmagan"}
              icon={HiOutlineCalendarDays}
              tone="sky"
              onClick={() => navigate(ROUTES.attendance)}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Tushum dinamikasi"
              description="So'nggi 6 oy bo'yicha to'langan summalar"
              className="xl:col-span-2"
              action={
                <Link
                  to={ROUTES.reports}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:opacity-75 dark:text-brand-300"
                >
                  Batafsil
                  <HiOutlineArrowRight className="size-3.5" />
                </Link>
              }
            >
              <AreaChart
                data={revenueSeries.map((item) => ({
                  ...item,
                  subLabel: `${item.count} to'lov · hisoblandi ${formatCompact(item.billed)}`,
                }))}
                height={264}
                color="#10b981"
                formatValue={(value) => formatCurrency(value, { compact: true })}
                yFormat={(value) => formatCompact(value)}
              />
            </SectionCard>

            <SectionCard
              title="Joriy oy to'lovlari"
              description={`${monthLabel(currentMonth)} · ${revenueTotals.count} yozuv`}
            >
              <DonutChart
                data={statusData}
                size={150}
                stroke={15}
                centerValue={`${revenueTotals.count}`}
                centerLabel="To'lovlar"
                legendClassName="space-y-2.5"
              />
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4">
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.08em] text-subtle uppercase">
                    Yig'ildi
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(revenueTotals.paid, { compact: true })}
                  </p>
                </div>
                <div>
                  <p className="text-[9.5px] font-bold tracking-[0.08em] text-subtle uppercase">
                    Qarz
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-extrabold text-rose-600 dark:text-rose-400">
                    {formatCurrency(revenueTotals.debt, { compact: true })}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="O'quvchilar o'sishi"
              description="Har oyda qo'shilgan yangi o'quvchilar"
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  <HiOutlineUsers className="size-4" />
                </span>
              }
            >
              <BarChart
                data={growthSeries}
                height={240}
                color="#8b5cf6"
                accentLast
                formatValue={(value) => `${value} o'quvchi`}
              />
            </SectionCard>

            <SectionCard
              title="Davomat tendensiyasi"
              description="Oylik o'rtacha davomat darajasi"
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                  <HiOutlineClock className="size-4" />
                </span>
              }
            >
              <AreaChart
                data={attendanceSeries}
                height={240}
                color="#0ea5e9"
                formatValue={(value) => `${value}%`}
                yFormat={(value) => `${value}%`}
              />
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Yangi o'quvchilar"
              description="Eng so'nggi qabul qilinganlar"
              className="xl:col-span-1"
              noPadding
              action={
                <Link
                  to={ROUTES.students}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:opacity-75 dark:text-brand-300"
                >
                  Barchasi
                  <HiOutlineArrowRight className="size-3.5" />
                </Link>
              }
            >
              {recentStudents.length === 0 ? (
                <EmptyState
                  compact
                  icon={HiOutlineAcademicCap}
                  title="O'quvchilar yo'q"
                  description="Birinchi o'quvchini qo'shing."
                />
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentStudents.map((student) => {
                    const group = groupMap.get(String(student.groupId))
                    const course = courseMap.get(String(student.courseId))
                    return (
                      <Link
                        key={student.id}
                        to={ROUTES.student(student.id)}
                        className="flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-[var(--surface-2)] sm:px-6"
                      >
                        <Avatar
                          firstName={student.firstName}
                          lastName={student.lastName}
                          src={student.photo}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-bold text-[var(--text)]">
                            {fullName(student)}
                          </p>
                          <p className="truncate text-[10px] text-subtle">
                            {group?.name || course?.name || 'Guruhsiz'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <PaymentStatusBadge status={student.paymentStatus} short />
                          <span className="text-[9.5px] text-subtle">
                            {formatDate(student.enrollmentDate, { withYear: false })}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="So'nggi to'lovlar"
              description="Eng yangi to'lov yozuvlari"
              className="xl:col-span-2"
              noPadding
              action={
                <Link
                  to={ROUTES.payments}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:opacity-75 dark:text-brand-300"
                >
                  Barchasi
                  <HiOutlineArrowRight className="size-3.5" />
                </Link>
              }
            >
              {recentPayments.length === 0 ? (
                <EmptyState
                  compact
                  icon={HiOutlineBanknotes}
                  title="To'lovlar yo'q"
                  description="Birinchi to'lovni qo'shing."
                />
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentPayments.map((payment) => {
                    const student = studentMap.get(String(payment.studentId))
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-[var(--surface-2)] sm:px-6"
                      >
                        <Avatar
                          firstName={student?.firstName || '?'}
                          lastName={student?.lastName || ''}
                          src={student?.photo}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-bold text-[var(--text)]">
                            {student ? fullName(student) : "O'quvchi o'chirilgan"}
                          </p>
                          <p className="text-[10px] text-subtle">
                            {monthLabel(payment.month)} · {payment.date ? formatDate(payment.date, { withYear: false }) : '—'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[12px] font-extrabold text-[var(--text)]">
                            {formatCurrency(paymentPaidAmount(payment), { compact: true })}
                          </p>
                          <p className="text-[9.5px] text-subtle">
                            / {formatCurrency(payment.amount, { compact: true })}
                          </p>
                        </div>
                        <PaymentStatusBadge status={payment.status} short />
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Yaqinlashayotgan tadbirlar"
              description="Rejalashtirilgan yig'ilishlar va imtihonlar"
              className="xl:col-span-2"
              noPadding
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <HiOutlineCalendarDays className="size-4" />
                </span>
              }
            >
              {eventsList.length === 0 ? (
                <EmptyState
                  compact
                  icon={HiOutlineCalendarDays}
                  title="Tadbirlar yo'q"
                  description="Yaqin kunlarga rejalashtirilgan tadbir topilmadi."
                />
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {eventsList.map((event) => {
                    const date = parseDate(event.date)
                    const style = EVENT_STYLES[event.type] || EVENT_STYLES.event
                    const left = daysUntil(event.date)
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--surface-2)] sm:px-6"
                      >
                        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                          <span className="text-[14px] leading-none font-extrabold text-[var(--text)]">
                            {date?.getDate()}
                          </span>
                          <span className="mt-0.5 text-[9px] font-bold tracking-wide text-subtle uppercase">
                            {date ? MONTH_SHORT[date.getMonth()] : '—'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                            {event.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-subtle">
                            <span className="flex items-center gap-1">
                              <HiOutlineClock className="size-3" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <HiOutlineMapPin className="size-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${style.chip}`}
                          >
                            {style.label}
                          </span>
                          <span className="text-[9.5px] text-subtle">
                            {left <= 0 ? 'bugun' : `${left} kun qoldi`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Tezkor amallar"
              description="Ko'p ishlatiladigan bo'limlar"
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <HiOutlinePlus className="size-4" />
                </span>
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`${ROUTES.students}?new=1`}
                  className="group flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm dark:hover:border-brand-400/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    <HiOutlineAcademicCap className="size-4" />
                  </span>
                  <span className="text-[11.5px] font-bold text-[var(--text)]">O'quvchi qo'shish</span>
                </Link>
                <Link
                  to={`${ROUTES.payments}?new=1`}
                  className="group flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-400/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <HiOutlineBanknotes className="size-4" />
                  </span>
                  <span className="text-[11.5px] font-bold text-[var(--text)]">To'lov kiritish</span>
                </Link>
                <Link
                  to={ROUTES.attendance}
                  className="group flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm dark:hover:border-sky-400/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                    <HiOutlineCalendarDays className="size-4" />
                  </span>
                  <span className="text-[11.5px] font-bold text-[var(--text)]">Davomat belgilash</span>
                </Link>
                <Link
                  to={ROUTES.groups}
                  className="group flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm dark:hover:border-violet-400/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <HiOutlineRectangleGroup className="size-4" />
                  </span>
                  <span className="text-[11.5px] font-bold text-[var(--text)]">Guruhlar</span>
                </Link>
              </div>

              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] text-subtle uppercase">
                  <HiOutlineExclamationCircle className="size-3" />
                  E'tibor talab qiladi
                </p>
                <div className="mt-2 space-y-1.5">
                  <p className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">To'lanmagan yozuvlar</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {revenueTotals.unpaidCount}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">Bugun belgilanmagan</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {todaySummary.total === 0 ? 'Barchasi' : 0}
                    </span>
                  </p>
                </div>
                <Link
                  to={ROUTES.reports}
                  className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-[var(--surface)] py-1.5 text-[10.5px] font-bold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                >
                  Hisobotni ko'rish
                  <HiOutlineArrowRight className="size-3" />
                </Link>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
