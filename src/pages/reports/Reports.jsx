import { useMemo, useState } from 'react'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import QuickStat from '@/components/common/QuickStat'
import ErrorState from '@/components/common/ErrorState'
import { SectionCard } from '@/components/common/SectionCard'
import { ChartSkeleton, StatCardsSkeleton } from '@/components/common/Skeleton'
import AreaChart from '@/components/charts/AreaChart'
import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import HorizontalBars from '@/components/charts/HorizontalBars'
import { useCollections } from '@/hooks/useApi'
import { toast } from '@/store/toastStore'
import { GROUP_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '@/utils/constants'
import {
  attendanceStats,
  fullName,
  monthlyRevenueSeries,
  paymentPaidAmount,
  paymentTotals,
  studentGrowthSeries,
} from '@/utils/stats'
import { downloadCsv } from '@/utils/csv'
import {
  formatCompact,
  formatCurrency,
  formatDateNumeric,
  lastNMonths,
  monthKey,
  monthLabel,
} from '@/utils/format'

const RESOURCES = {
  students: 'students',
  teachers: 'teachers',
  groups: 'groups',
  courses: 'courses',
  payments: 'payments',
  attendance: 'attendance',
}

const PERIOD_OPTIONS = [
  { value: 3, label: "So'nggi 3 oy" },
  { value: 6, label: "So'nggi 6 oy" },
  { value: 12, label: "So'nggi 12 oy" },
]

const PAYMENT_COLORS = {
  paid: '#10b981',
  partial: '#f59e0b',
  unpaid: '#f43f5e',
}

export default function Reports() {
  const { data, loading, error, reload } = useCollections(RESOURCES)
  const [period, setPeriod] = useState(6)

  const students = data.students || []
  const teachers = data.teachers || []
  const groups = data.groups || []
  const courses = data.courses || []
  const payments = data.payments || []
  const attendance = data.attendance || []

  const months = useMemo(() => lastNMonths(period), [period])
  const monthKeys = useMemo(() => new Set(months.map((month) => month.key)), [months])

  const periodPayments = useMemo(
    () => payments.filter((payment) => monthKeys.has(payment.month || monthKey(payment.date))),
    [payments, monthKeys],
  )
  const periodAttendance = useMemo(
    () => attendance.filter((record) => monthKeys.has(monthKey(record.date))),
    [attendance, monthKeys],
  )

  const revenueSeries = useMemo(() => monthlyRevenueSeries(payments, months), [payments, months])
  const growthSeries = useMemo(
    () => studentGrowthSeries(students, months).map((item) => ({ ...item, value: item.joined })),
    [students, months],
  )
  const attendanceSeries = useMemo(
    () =>
      months.map((month) => {
        const records = periodAttendance.filter((record) => monthKey(record.date) === month.key)
        const stats = attendanceStats(records)
        return {
          key: month.key,
          label: month.label,
          fullLabel: month.fullLabel,
          value: stats.rate,
          subLabel: `${stats.total} dars yozuvi`,
        }
      }),
    [months, periodAttendance],
  )

  const totals = useMemo(() => paymentTotals(periodPayments), [periodPayments])
  const attendanceSummary = useMemo(
    () => attendanceStats(periodAttendance),
    [periodAttendance],
  )
  const joined = useMemo(
    () => students.filter((student) => monthKeys.has(monthKey(student.enrollmentDate))).length,
    [students, monthKeys],
  )

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
  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [String(teacher.id), teacher])),
    [teachers],
  )

  const courseRows = useMemo(() => {
    const rows = courses.map((course) => {
      const courseStudents = students.filter(
        (student) => String(student.courseId) === String(course.id),
      )
      const studentIds = new Set(courseStudents.map((student) => String(student.id)))
      const coursePayments = periodPayments.filter((payment) =>
        studentIds.has(String(payment.studentId)),
      )
      return {
        course,
        students: courseStudents.length,
        groups: groups.filter((group) => String(group.courseId) === String(course.id)).length,
        revenue: coursePayments.reduce((total, payment) => total + paymentPaidAmount(payment), 0),
        debt: paymentTotals(coursePayments).debt,
      }
    })
    return rows.sort((a, b) => b.revenue - a.revenue)
  }, [courses, students, groups, periodPayments])

  const attendanceRows = useMemo(
    () =>
      groups
        .map((group) => {
          const records = periodAttendance.filter(
            (record) => String(record.groupId) === String(group.id),
          )
          return {
            group,
            teacher: teacherMap.get(String(group.teacherId)),
            course: courseMap.get(String(group.courseId)),
            ...attendanceStats(records),
          }
        })
        .filter((row) => row.total > 0)
        .sort((a, b) => b.rate - a.rate),
    [groups, periodAttendance, teacherMap, courseMap],
  )

  const statusData = useMemo(
    () => [
      { label: "To'langan", value: totals.paidCount, color: PAYMENT_COLORS.paid },
      { label: 'Qisman', value: totals.partialCount, color: PAYMENT_COLORS.partial },
      { label: "To'lanmagan", value: totals.unpaidCount, color: PAYMENT_COLORS.unpaid },
    ],
    [totals],
  )

  const groupStatusData = useMemo(
    () =>
      Object.entries(GROUP_STATUS).map(([key, meta]) => ({
        label: meta.label,
        value: groups.filter((group) => group.status === key).length,
        color: key === 'active' ? '#10b981' : key === 'planned' ? '#0ea5e9' : '#94a3b8',
      })),
    [groups],
  )

  const topCourses = useMemo(
    () =>
      courseRows.slice(0, 6).map((row) => ({
        label: row.course.name,
        value: row.revenue,
        color: '#6d34ec',
        caption: `${row.students} o'quvchi · ${row.groups} guruh`,
      })),
    [courseRows],
  )

  function handleExport() {
    if (!periodPayments.length) {
      toast.error("Eksport uchun ma'lumot yo'q", "Tanlangan davrda to'lov yozuvlari topilmadi.")
      return
    }

    const rows = [
      [
        "O'quvchi",
        'Telefon',
        'Guruh',
        'Kurs',
        'Oy',
        'Summa',
        "To'langan",
        'Qarz',
        'Holat',
        'Usul',
        'Sana',
      ],
      ...[...periodPayments]
        .sort((a, b) => String(a.month).localeCompare(String(b.month)))
        .map((payment) => {
          const student = studentMap.get(String(payment.studentId))
          const group = groupMap.get(String(student?.groupId))
          const course = courseMap.get(String(student?.courseId))
          const paid = paymentPaidAmount(payment)
          return [
            student ? fullName(student) : `ID #${payment.studentId}`,
            student?.phone || '',
            group?.name || '',
            course?.name || '',
            monthLabel(payment.month),
            payment.amount,
            paid,
            Math.max(Number(payment.amount) - paid, 0),
            PAYMENT_STATUS[payment.status]?.label || payment.status,
            PAYMENT_METHODS[payment.method]?.label || payment.method,
            payment.date ? formatDateNumeric(payment.date) : '',
          ]
        }),
    ]

    downloadCsv(`nexus-to-lovlar-hisoboti-${period}-oy.csv`, rows)
    toast.success('CSV fayl yuklandi', `${periodPayments.length} ta to'lov yozuvi`)
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Hisobotlar" description="Moliyaviy va akademik ko'rsatkichlar." />
        <ErrorState onRetry={reload} description={error} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hisobotlar"
        description="Moliyaviy, akademik va davomat ko'rsatkichlari. Ma'lumotlarni CSV formatida eksport qiling."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlineArrowDownTray} onClick={handleExport}>
              CSV yuklab olish
            </Button>
          </>
        }
      />

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-bold text-[var(--text)]">Hisobot davri</p>
          <p className="mt-0.5 text-[11.5px] text-subtle">
            {months[0]?.fullLabel} — {months[months.length - 1]?.fullLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={
                period === option.value
                  ? 'rounded-lg bg-brand-600 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-sm'
                  : 'rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11.5px] font-semibold text-muted transition-colors hover:text-[var(--text)]'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <>
          <StatCardsSkeleton count={4} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <ChartSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuickStat
              label="Davr tushumi"
              value={formatCurrency(totals.paid, { compact: true })}
              icon={HiOutlineBanknotes}
              tone="emerald"
              hint={`${periodPayments.length} to'lov`}
            />
            <QuickStat
              label="Davr qarzdorligi"
              value={formatCurrency(totals.debt, { compact: true })}
              icon={HiOutlineExclamationCircle}
              tone={totals.debt > 0 ? 'rose' : 'emerald'}
            />
            <QuickStat
              label="Davomat darajasi"
              value={`${attendanceSummary.rate}%`}
              icon={HiOutlineClock}
              tone={attendanceSummary.rate >= 85 ? 'emerald' : attendanceSummary.rate >= 70 ? 'amber' : 'rose'}
              hint={`${attendanceSummary.total} yozuv`}
            />
            <QuickStat
              label="Yangi o'quvchilar"
              value={joined}
              icon={HiOutlineArrowTrendingUp}
              tone="violet"
              hint={`${students.length} jami`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard
              title="Oylik tushum dinamikasi"
              description="To'langan summalar asosida (so'm)"
              className="xl:col-span-2"
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <HiOutlineChartBar className="size-4" />
                </span>
              }
            >
              <AreaChart
                data={revenueSeries.map((item) => ({
                  ...item,
                  subLabel: `${item.count} to'lov · hisoblandi ${formatCompact(item.billed)}`,
                }))}
                height={260}
                color="#10b981"
                formatValue={(value) => formatCurrency(value, { compact: true })}
                yFormat={(value) => formatCompact(value)}
              />
            </SectionCard>

            <SectionCard
              title="To'lov holatlari"
              description={`${periodPayments.length} ta yozuv kesimida`}
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <HiOutlineBanknotes className="size-4" />
                </span>
              }
            >
              <DonutChart
                data={statusData}
                size={150}
                stroke={15}
                centerValue={`${totals.paidCount + totals.partialCount + totals.unpaidCount}`}
                centerLabel="To'lovlar"
                legendClassName="space-y-2.5"
              />
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Yangi o'quvchilar o'sishi"
              description="Har oyda qo'shilgan o'quvchilar soni"
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  <HiOutlineUserGroup className="size-4" />
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
              description="Oylar bo'yicha o'rtacha davomat foizi"
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
              title="Kurslar bo'yicha tushum"
              description="Tanlangan davrda eng yuqori daromad"
              className="xl:col-span-2"
            >
              <HorizontalBars
                data={topCourses}
                formatValue={(value) => formatCurrency(value, { compact: true })}
              />
            </SectionCard>

            <SectionCard title="Guruhlar holati" description={`${groups.length} ta guruh`}>
              <DonutChart
                data={groupStatusData}
                size={150}
                stroke={15}
                centerValue={groups.length}
                centerLabel="Guruhlar"
                legendClassName="space-y-2.5"
              />
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Kurslar kesimida moliya"
              description="Davr bo'yicha to'lovlar va qarzdorlik"
              noPadding
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <HiOutlineAcademicCap className="size-4" />
                </span>
              }
            >
              <div className="overflow-x-auto">
                <table className="table-shell">
                  <thead>
                    <tr>
                      <th>Kurs</th>
                      <th>O'quvchi</th>
                      <th>Tushum</th>
                      <th>Qarz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseRows.map((row) => (
                      <tr key={row.course.id}>
                        <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                          {row.course.name}
                        </td>
                        <td className="text-muted">{row.students}</td>
                        <td className="font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.revenue, { compact: true })}
                        </td>
                        <td
                          className={
                            row.debt > 0
                              ? 'font-semibold whitespace-nowrap text-rose-600 dark:text-rose-400'
                              : 'text-subtle'
                          }
                        >
                          {row.debt > 0 ? formatCurrency(row.debt, { compact: true }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Guruhlar kesimida davomat"
              description="Davr bo'yicha eng yuqori davomat"
              noPadding
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <HiOutlineClock className="size-4" />
                </span>
              }
            >
              {attendanceRows.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-subtle sm:px-6">
                  Tanlangan davrda davomat yozuvlari topilmadi.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-shell">
                    <thead>
                      <tr>
                        <th>Guruh</th>
                        <th>O'qituvchi</th>
                        <th>Darslar</th>
                        <th>Davomat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRows.slice(0, 8).map((row) => (
                        <tr key={row.group.id}>
                          <td>
                            <p className="font-semibold whitespace-nowrap text-[var(--text)]">
                              {row.group.name}
                            </p>
                            <p className="text-[10px] text-subtle">{row.course?.name || '—'}</p>
                          </td>
                          <td className="whitespace-nowrap text-muted">
                            {row.teacher ? fullName(row.teacher) : '—'}
                          </td>
                          <td className="text-muted">{row.total}</td>
                          <td>
                            <span
                              className={
                                row.rate >= 85
                                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                  : row.rate >= 70
                                    ? 'font-bold text-amber-600 dark:text-amber-400'
                                    : 'font-bold text-rose-600 dark:text-rose-400'
                              }
                            >
                              {row.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <p className="text-center text-[10.5px] text-subtle">
            Hisobot {formatDateNumeric(new Date())} holatiga ko'ra {period} oylik ma'lumotlar asosida
            shakllantirildi.
          </p>
        </>
      )}
    </div>
  )
}
