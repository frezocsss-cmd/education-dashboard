import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineClock,
  HiOutlineIdentification,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineRectangleGroup,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineWallet,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Button from '@/components/common/Button'
import ErrorState from '@/components/common/ErrorState'
import EmptyState from '@/components/common/EmptyState'
import Modal from '@/components/common/Modal'
import { DetailSkeleton } from '@/components/common/Skeleton'
import { InfoRow, SectionCard } from '@/components/common/SectionCard'
import QuickStat from '@/components/common/QuickStat'
import {
  LevelBadge,
  PaymentStatusBadge,
} from '@/components/common/EntityBadges'
import DonutChart from '@/components/charts/DonutChart'
import StudentForm from '@/components/forms/StudentForm'
import { useCollection, useRecord } from '@/hooks/useApi'
import { api } from '@/services/api'
import { detachStudentRelations, syncStudentRelations } from '@/utils/relations'
import { confirm } from '@/store/confirmStore'
import { toast } from '@/store/toastStore'
import {
  attendanceStats,
  paymentTotals,
  paymentPaidAmount,
} from '@/utils/stats'
import { formatCurrency, formatDate, formatPhone, monthLabel } from '@/utils/format'
import { ROUTES } from '@/routes/paths'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: student, loading, error, reload } = useRecord('students', id)
  const { data: courses, loading: coursesLoading } = useCollection('courses')
  const { data: groups, loading: groupsLoading, reload: reloadGroups } = useCollection('groups')
  const { data: teachers, loading: teachersLoading } = useCollection('teachers')
  const { data: parents, loading: parentsLoading, reload: reloadParents } = useCollection('parents')
  const {
    data: allPayments,
    loading: paymentsLoading,
  } = useCollection('payments')
  const {
    data: allAttendance,
    loading: attendanceLoading,
  } = useCollection('attendance')

  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const course = useMemo(
    () => courses.find((item) => String(item.id) === String(student?.courseId)),
    [courses, student?.courseId],
  )
  const group = useMemo(
    () => groups.find((item) => String(item.id) === String(student?.groupId)),
    [groups, student?.groupId],
  )
  const teacher = useMemo(
    () => teachers.find((item) => String(item.id) === String(group?.teacherId)),
    [teachers, group?.teacherId],
  )
  const parent = useMemo(
    () => parents.find((item) => String(item.id) === String(student?.parentId)),
    [parents, student?.parentId],
  )

  const payments = useMemo(
    () =>
      allPayments
        .filter((item) => String(item.studentId) === String(id))
        .sort((a, b) => String(b.month || '').localeCompare(String(a.month || ''))),
    [allPayments, id],
  )
  const attendance = useMemo(
    () =>
      allAttendance
        .filter((item) => String(item.studentId) === String(id))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [allAttendance, id],
  )
  const totals = useMemo(() => paymentTotals(payments), [payments])
  const stats = useMemo(() => attendanceStats(attendance), [attendance])

  const isLoading =
    loading ||
    coursesLoading ||
    groupsLoading ||
    teachersLoading ||
    parentsLoading ||
    paymentsLoading ||
    attendanceLoading

  if (isLoading) return <DetailSkeleton />

  if (error || !student) {
    return (
      <ErrorState
        title="O'quvchi topilmadi"
        description="Bu ID bo'yicha o'quvchi mavjud emas yoki ma'lumotlar bazasidan o'chirilgan."
        onRetry={reload}
      />
    )
  }

  const fullName = `${student.firstName} ${student.lastName}`

  async function handleSave(values) {
    setSubmitting(true)
    try {
      const payload = { ...student, ...values, id: student.id }
      await api.update('students', student.id, payload)
      await syncStudentRelations({ previous: student, next: payload, groups, parents })
      toast.success('Profil yangilandi', `${values.firstName} ${values.lastName}`)
      setEditOpen(false)
      reload()
      reloadGroups()
      reloadParents()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    const approved = await confirm({
      title: "O'quvchini o'chirish",
      description: `“${fullName}” butunlay o'chiriladi. To'lov va davomat tarixi ham o'chib ketadi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await detachStudentRelations({ student, groups, parents })
      await api.remove('students', student.id)
      await Promise.all([
        ...payments.map((item) => api.remove('payments', item.id)),
        ...attendance.map((item) => api.remove('attendance', item.id)),
      ])
      toast.success("O'quvchi o'chirildi", fullName)
      navigate(ROUTES.students)
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  const donutData = [
    { label: 'Keldi', value: stats.present, color: '#10b981' },
    { label: 'Kechikdi', value: stats.late, color: '#f59e0b' },
    { label: 'Kelmadi', value: stats.absent, color: '#f43f5e' },
  ]

  return (
    <div className="space-y-5">
      <Link
        to={ROUTES.students}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <HiOutlineArrowRight className="size-3.5 rotate-180" />
        O'quvchilar ro'yxati
      </Link>

      <div className="card overflow-hidden">
        <div className="relative h-28 bg-[linear-gradient(110deg,#5f26d2,#7c3aed_55%,#4f46e5)] sm:h-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(59,130,246,0.35),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur">
            ID #{student.id}
          </span>
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4 sm:gap-5">
              <Avatar
                firstName={student.firstName}
                lastName={student.lastName}
                src={student.photo}
                size="2xl"
                className="-mt-12 shrink-0 sm:-mt-14"
                ring
              />
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-extrabold tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
                  {fullName}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <LevelBadge level={student.level} />
                  <PaymentStatusBadge status={student.paymentStatus} />
                  <span className="chip">
                    <HiOutlineRectangleGroup className="size-3" />
                    {group?.name || 'Guruhsiz'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-1">
              <Button
                variant="secondary"
                size="sm"
                icon={HiOutlinePencilSquare}
                onClick={() => setEditOpen(true)}
              >
                Tahrirlash
              </Button>
              <Button variant="danger" size="sm" icon={HiOutlineTrash} onClick={handleDelete}>
                O'chirish
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4">
            <a
              href={`tel:${student.parentPhone}`}
              className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
            >
              <HiOutlinePhone className="size-3.5" />
              {formatPhone(student.phone)}
            </a>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineUserGroup className="size-3.5" />
              {student.parentName}
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineCalendarDays className="size-3.5" />
              {formatDate(student.enrollmentDate)} dan beri
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineAcademicCap className="size-3.5" />
              {course?.name || 'Kurs tanlanmagan'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Oylik to'lov"
          value={formatCurrency(student.monthlyFee, { compact: true })}
          icon={HiOutlineWallet}
          tone="brand"
        />
        <QuickStat
          label="Jami to'langan"
          value={formatCurrency(totals.paid, { compact: true })}
          icon={HiOutlineBanknotes}
          tone="emerald"
        />
        <QuickStat
          label="Qarzdorlik"
          value={formatCurrency(totals.debt, { compact: true })}
          icon={HiOutlineBanknotes}
          tone={totals.debt > 0 ? 'rose' : 'emerald'}
        />
        <QuickStat
          label="Davomat"
          value={`${stats.rate}%`}
          icon={HiOutlineClock}
          tone={stats.rate >= 85 ? 'emerald' : stats.rate >= 70 ? 'amber' : 'rose'}
          hint={`${stats.total} dars`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Shaxsiy ma'lumotlar"
          description="O'quvchining asosiy ma'lumotlari"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              <HiOutlineIdentification className="size-4" />
            </span>
          }
        >
          <div className="space-y-2.5">
            <InfoRow label="To'liq ism" value={fullName} />
            <InfoRow label="Telefon" icon={HiOutlinePhone} value={formatPhone(student.phone)} />
            <InfoRow
              label="Qabul sanasi"
              icon={HiOutlineCalendarDays}
              value={formatDate(student.enrollmentDate)}
            />
            <InfoRow
              label="Daraja"
              icon={HiOutlineAcademicCap}
              value={student.level}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Ota-ona"
          description="Bog'langan ota-ona ma'lumotlari"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <HiOutlineUserGroup className="size-4" />
            </span>
          }
        >
          <div className="space-y-2.5">
            <InfoRow label="Ism" icon={HiOutlineUser} value={student.parentName} />
            <InfoRow
              label="Telefon"
              icon={HiOutlinePhone}
              value={formatPhone(student.parentPhone)}
              href={`tel:${student.parentPhone}`}
            />
            {parent && (
              <Link
                to={ROUTES.parent(parent.id)}
                className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-brand-600 hover:opacity-75 dark:text-brand-300"
              >
                Ota-ona profilini ko'rish
                <HiOutlineArrowRight className="size-3.5" />
              </Link>
            )}
            {parent?.address && (
              <p className="pt-1 text-[11px] leading-relaxed text-subtle">{parent.address}</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Kurs va guruh"
          description="Ta'lim yo'nalishi"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <HiOutlineAcademicCap className="size-4" />
            </span>
          }
        >
          <div className="space-y-2.5">
            <InfoRow label="Kurs" icon={HiOutlineAcademicCap} value={course?.name || '—'} />
            <InfoRow
              label="Guruh"
              icon={HiOutlineRectangleGroup}
              value={
                group ? (
                  <Link
                    to={ROUTES.group(group.id)}
                    className="text-brand-600 hover:opacity-75 dark:text-brand-300"
                  >
                    {group.name}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow
              label="O'qituvchi"
              icon={HiOutlineUser}
              value={
                teacher ? (
                  <Link
                    to={ROUTES.teacher(teacher.id)}
                    className="text-brand-600 hover:opacity-75 dark:text-brand-300"
                  >
                    {teacher.firstName} {teacher.lastName}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow
              label="Dars jadvali"
              icon={HiOutlineClock}
              value={group ? `${group.days} · ${group.time}` : '—'}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="To'lovlar tarixi"
          description={`${payments.length} ta oylik yozuv · qarzdorlik ${formatCurrency(totals.debt, { compact: true })}`}
          className="xl:col-span-2"
          noPadding
          action={
            <Link
              to={ROUTES.payments}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:opacity-75 dark:text-brand-300"
            >
              To'lovlar bo'limi
              <HiOutlineArrowRight className="size-3.5" />
            </Link>
          }
        >
          {payments.length === 0 ? (
            <EmptyState
              compact
              icon={HiOutlineBanknotes}
              title="To'lovlar mavjud emas"
              description="Bu o'quvchi uchun hali to'lov yozuvi kiritilmagan."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Oy</th>
                    <th>Summa</th>
                    <th>To'langan</th>
                    <th>Holat</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                        {monthLabel(payment.month)}
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {formatCurrency(payment.amount, { compact: true })}
                      </td>
                      <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                        {formatCurrency(paymentPaidAmount(payment), { compact: true })}
                      </td>
                      <td>
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {payment.date ? formatDate(payment.date) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Davomat xulosasi"
          description={`${stats.total} ta dars yozuvi asosida`}
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <HiOutlineClock className="size-4" />
            </span>
          }
        >
          <DonutChart
            data={donutData}
            size={142}
            stroke={14}
            centerValue={`${stats.rate}%`}
            centerLabel="Davomat"
            legendClassName="space-y-2"
          />
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="mb-2 text-[10px] font-bold tracking-[0.1em] text-subtle uppercase">
              So'nggi darslar
            </p>
            {attendance.length === 0 ? (
              <p className="py-3 text-xs text-subtle">Davomat yozuvlari yo'q.</p>
            ) : (
              <div className="space-y-1.5">
                {attendance.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5"
                  >
                    <span className="text-[11px] font-medium text-muted">
                      {formatDate(record.date, { withYear: false })}
                    </span>
                    <span
                      className={
                        record.status === 'present'
                          ? 'text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400'
                          : record.status === 'late'
                            ? 'text-[10.5px] font-bold text-amber-600 dark:text-amber-400'
                            : 'text-[10.5px] font-bold text-rose-600 dark:text-rose-400'
                      }
                    >
                      {record.status === 'present'
                        ? 'Keldi'
                        : record.status === 'late'
                          ? 'Kechikdi'
                          : 'Kelmadi'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Qo'shimcha izohlar"
        description="Administrator tomonidan qoldirilgan eslatmalar"
        action={
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <HiOutlineChatBubbleBottomCenterText className="size-4" />
          </span>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted">
          {student.notes || "Bu o'quvchi uchun qo'shimcha izoh kiritilmagan."}
        </p>
      </SectionCard>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="lg"
        title="O'quvchi ma'lumotlarini tahrirlash"
        description={`${fullName} profili ma'lumotlarini yangilang.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" form="student-detail-form" variant="primary" loading={submitting}>
              Saqlash
            </Button>
          </>
        }
      >
        <StudentForm
          formId="student-detail-form"
          initialValues={student}
          parents={parents}
          courses={courses}
          groups={groups}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
