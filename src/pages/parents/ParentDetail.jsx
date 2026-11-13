import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineRectangleGroup,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineUsers,
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
  PaymentMethodBadge,
  PaymentStatusBadge,
} from '@/components/common/EntityBadges'
import DonutChart from '@/components/charts/DonutChart'
import ParentForm from '@/components/forms/ParentForm'
import { useCollection, useRecord } from '@/hooks/useApi'
import { api } from '@/services/api'
import {
  detachParentRelations,
  syncParentContact,
  syncParentStudents,
} from '@/utils/relations'
import { confirm } from '@/store/confirmStore'
import { toast } from '@/store/toastStore'
import { attendanceStats, fullName, paymentTotals } from '@/utils/stats'
import { formatCurrency, formatDate, formatPhone, monthLabel } from '@/utils/format'
import { ROUTES } from '@/routes/paths'

export default function ParentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: parent, loading, error, reload } = useRecord('parents', id)
  const { data: students, loading: studentsLoading, reload: reloadStudents } =
    useCollection('students')
  const { data: groups, loading: groupsLoading } = useCollection('groups')
  const { data: courses, loading: coursesLoading } = useCollection('courses')
  const {
    data: payments,
    loading: paymentsLoading,
    reload: reloadPayments,
  } = useCollection('payments')
  const { data: attendance, loading: attendanceLoading } = useCollection('attendance')

  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const children = useMemo(() => {
    if (!parent) return []
    const list = students.filter(
      (student) =>
        String(student.parentId) === String(parent.id) ||
        (parent.studentIds || []).map(String).includes(String(student.id)),
    )
    return [...list].sort((a, b) => fullName(a).localeCompare(fullName(b)))
  }, [students, parent])

  const groupMap = useMemo(
    () => new Map(groups.map((group) => [String(group.id), group])),
    [groups],
  )
  const courseMap = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course])),
    [courses],
  )

  const childIds = useMemo(() => children.map((child) => String(child.id)), [children])
  const childPayments = useMemo(
    () =>
      payments
        .filter((payment) => childIds.includes(String(payment.studentId)))
        .sort((a, b) => String(b.month || '').localeCompare(String(a.month || ''))),
    [payments, childIds],
  )
  const childAttendance = useMemo(
    () => attendance.filter((record) => childIds.includes(String(record.studentId))),
    [attendance, childIds],
  )

  const totals = useMemo(() => paymentTotals(childPayments), [childPayments])
  const attendanceSummary = useMemo(() => attendanceStats(childAttendance), [childAttendance])
  const monthlyFees = useMemo(
    () => children.reduce((total, child) => total + Number(child.monthlyFee || 0), 0),
    [children],
  )

  const isLoading =
    loading ||
    studentsLoading ||
    groupsLoading ||
    coursesLoading ||
    paymentsLoading ||
    attendanceLoading

  if (isLoading) return <DetailSkeleton />

  if (error || !parent) {
    return (
      <ErrorState
        title="Ota-ona topilmadi"
        description="Bu ID bo'yicha ota-ona mavjud emas yoki ma'lumotlar bazasidan o'chirilgan."
        onRetry={reload}
      />
    )
  }

  const name = fullName(parent)

  async function handleSave(values) {
    setSubmitting(true)
    try {
      const payload = { ...parent, ...values, id: parent.id }
      await api.update('parents', parent.id, payload)
      await syncParentStudents({ parent: payload, nextStudentIds: values.studentIds })
      await syncParentContact({ parent: payload, students })
      toast.success("Ota-ona ma'lumotlari yangilandi", fullName(values))
      setEditOpen(false)
      reload()
      reloadStudents()
      reloadPayments()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    const approved = await confirm({
      title: "Ota-onani o'chirish",
      description: `“${name}” o'chiriladi. Farzandlari saqlanadi, faqat ularning ota-ona havolasi uziladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await detachParentRelations({ parent, students })
      await api.remove('parents', parent.id)
      toast.success("Ota-ona o'chirildi", name)
      navigate(ROUTES.parents)
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  const donutData = [
    { label: 'Keldi', value: attendanceSummary.present, color: '#10b981' },
    { label: 'Kechikdi', value: attendanceSummary.late, color: '#f59e0b' },
    { label: 'Kelmadi', value: attendanceSummary.absent, color: '#f43f5e' },
  ]

  return (
    <div className="space-y-5">
      <Link
        to={ROUTES.parents}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <HiOutlineArrowRight className="size-3.5 rotate-180" />
        Ota-onalar ro'yxati
      </Link>

      <div className="card overflow-hidden">
        <div className="relative h-28 bg-[linear-gradient(110deg,#0369a1,#0284c7_55%,#4f46e5)] sm:h-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(59,130,246,0.35),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur">
            ID #{parent.id}
          </span>
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4 sm:gap-5">
              <Avatar
                firstName={parent.firstName}
                lastName={parent.lastName}
                size="2xl"
                className="-mt-12 shrink-0 sm:-mt-14"
                ring
              />
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-extrabold tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
                  {name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="chip">
                    <HiOutlineUsers className="size-3" />
                    {children.length} farzand
                  </span>
                  <span className="chip">
                    <HiOutlineMapPin className="size-3" />
                    <span className="max-w-[200px] truncate">{parent.address || 'Manzil yo‘q'}</span>
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
              href={`tel:${parent.phone}`}
              className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
            >
              <HiOutlinePhone className="size-3.5" />
              {formatPhone(parent.phone)}
            </a>
            <a
              href={`mailto:${parent.email || ''}`}
              className="flex items-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
            >
              <HiOutlineEnvelope className="size-3.5" />
              {parent.email || 'Email kiritilmagan'}
            </a>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineUserGroup className="size-3.5" />
              {children.length} ta farzand
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Oylik to'lovlar"
          value={formatCurrency(monthlyFees, { compact: true })}
          icon={HiOutlineWallet}
          tone="brand"
          hint={`${children.length} farzand`}
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
          value={`${attendanceSummary.rate}%`}
          icon={HiOutlineClock}
          tone={
            attendanceSummary.rate >= 85
              ? 'emerald'
              : attendanceSummary.rate >= 70
                ? 'amber'
                : 'rose'
          }
          hint={`${attendanceSummary.total} dars`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Aloqa ma'lumotlari"
          description="Ota-ona bilan bog'lanish uchun"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <HiOutlineIdentification className="size-4" />
            </span>
          }
        >
          <div className="space-y-2.5">
            <InfoRow label="To'liq ism" value={name} />
            <InfoRow
              label="Telefon"
              icon={HiOutlinePhone}
              value={formatPhone(parent.phone)}
              href={`tel:${parent.phone}`}
            />
            <InfoRow
              label="Email"
              icon={HiOutlineEnvelope}
              value={parent.email || '—'}
              href={parent.email ? `mailto:${parent.email}` : undefined}
            />
            <InfoRow label="Yashash manzili" icon={HiOutlineMapPin} value={parent.address} />
          </div>
        </SectionCard>

        <SectionCard
          title="Farzandlari"
          description={`${children.length} ta o'quvchi bog'langan`}
          className="lg:col-span-2"
          noPadding
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <HiOutlineUserGroup className="size-4" />
            </span>
          }
        >
          {children.length === 0 ? (
            <EmptyState
              compact
              icon={HiOutlineUserGroup}
              title="Farzandlar bog'lanmagan"
              description="Tahrirlash orqali o'quvchilarni bu ota-onaga bog'lashingiz mumkin."
              action={
                <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                  Farzand qo'shish
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {children.map((child) => {
                const group = groupMap.get(String(child.groupId))
                const course = courseMap.get(String(child.courseId))
                return (
                  <Link
                    key={child.id}
                    to={ROUTES.student(child.id)}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)] sm:px-6"
                  >
                    <Avatar
                      firstName={child.firstName}
                      lastName={child.lastName}
                      src={child.photo}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                        {fullName(child)}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-subtle">
                        <span className="flex items-center gap-1">
                          <HiOutlineAcademicCap className="size-3" />
                          {course?.name || 'Kurs yo‘q'}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineRectangleGroup className="size-3" />
                          {group?.name || 'Guruhsiz'}
                        </span>
                      </p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                      <LevelBadge level={child.level} />
                      <PaymentStatusBadge status={child.paymentStatus} short />
                    </div>
                    <HiOutlineArrowRight className="size-4 shrink-0 text-[var(--text-3)]" />
                  </Link>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Farzandlar to'lovlari"
          description={`${childPayments.length} ta yozuv · qarzdorlik ${formatCurrency(totals.debt, {
            compact: true,
          })}`}
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
          {childPayments.length === 0 ? (
            <EmptyState
              compact
              icon={HiOutlineBanknotes}
              title="To'lovlar mavjud emas"
              description="Bog'langan farzandlar uchun hali to'lov yozuvi kiritilmagan."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>O'quvchi</th>
                    <th>Oy</th>
                    <th>Summa</th>
                    <th>Holat</th>
                    <th>Usul</th>
                  </tr>
                </thead>
                <tbody>
                  {childPayments.slice(0, 8).map((payment) => {
                    const child = children.find(
                      (item) => String(item.id) === String(payment.studentId),
                    )
                    return (
                      <tr key={payment.id}>
                        <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                          {child ? fullName(child) : '—'}
                        </td>
                        <td className="whitespace-nowrap text-muted">
                          {monthLabel(payment.month)}
                        </td>
                        <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                          {formatCurrency(payment.amount, { compact: true })}
                        </td>
                        <td>
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td>
                          <PaymentMethodBadge method={payment.method} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Davomat xulosasi"
          description={`${attendanceSummary.total} ta dars yozuvi asosida`}
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
            centerValue={`${attendanceSummary.rate}%`}
            centerLabel="Davomat"
            legendClassName="space-y-2"
          />
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="mb-2 text-[10px] font-bold tracking-[0.1em] text-subtle uppercase">
              Oxirgi to'lov sanasi
            </p>
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
              <HiOutlineCalendarDays className="size-3.5" />
              {childPayments[0]?.date ? formatDate(childPayments[0].date) : '—'}
            </p>
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
          {parent.notes || "Bu ota-ona uchun qo'shimcha izoh kiritilmagan."}
        </p>
      </SectionCard>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="lg"
        title="Ota-ona ma'lumotlarini tahrirlash"
        description={`${name} profili va farzandlari bog'lanishini yangilang.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" form="parent-detail-form" variant="primary" loading={submitting}>
              Saqlash
            </Button>
          </>
        }
      >
        <ParentForm
          formId="parent-detail-form"
          initialValues={parent}
          students={students}
          groups={groups}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
