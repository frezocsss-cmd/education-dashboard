import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineWallet,
  HiOutlineXMark,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Button from '@/components/common/Button'
import ErrorState from '@/components/common/ErrorState'
import EmptyState from '@/components/common/EmptyState'
import Modal from '@/components/common/Modal'
import { DetailSkeleton } from '@/components/common/Skeleton'
import { InfoRow, SectionCard } from '@/components/common/SectionCard'
import QuickStat from '@/components/common/QuickStat'
import { GroupStatusBadge, LevelBadge, PaymentStatusBadge } from '@/components/common/EntityBadges'
import DonutChart from '@/components/charts/DonutChart'
import GroupForm from '@/components/forms/GroupForm'
import { useCollection, useRecord } from '@/hooks/useApi'
import { api } from '@/services/api'
import { detachGroupRelations, syncGroupStudents } from '@/utils/relations'
import { confirm } from '@/store/confirmStore'
import { toast } from '@/store/toastStore'
import {
  attendanceByDate,
  attendanceStats,
  fullName,
  paymentTotals,
} from '@/utils/stats'
import { formatCurrency, formatDate, monthLabel } from '@/utils/format'
import { ROUTES } from '@/routes/paths'

const COLOR_BANNERS = {
  violet: 'bg-[linear-gradient(110deg,#6d28d9,#7c3aed_55%,#4f46e5)]',
  indigo: 'bg-[linear-gradient(110deg,#4338ca,#4f46e5_55%,#2563eb)]',
  emerald: 'bg-[linear-gradient(110deg,#047857,#059669_55%,#0d9488)]',
  sky: 'bg-[linear-gradient(110deg,#0369a1,#0284c7_55%,#2563eb)]',
  rose: 'bg-[linear-gradient(110deg,#be123c,#e11d48_55%,#db2777)]',
  amber: 'bg-[linear-gradient(110deg,#b45309,#d97706_55%,#ea580c)]',
  teal: 'bg-[linear-gradient(110deg,#0f766e,#0d9488_55%,#0891b2)]',
  orange: 'bg-[linear-gradient(110deg,#c2410c,#ea580c_55%,#d97706)]',
}

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: group, loading, error, reload } = useRecord('groups', id)
  const { data: students, loading: studentsLoading, reload: reloadStudents } =
    useCollection('students')
  const { data: courses, loading: coursesLoading } = useCollection('courses')
  const { data: teachers, loading: teachersLoading } = useCollection('teachers')
  const { data: groups, loading: groupsLoading, reload: reloadGroups } = useCollection('groups')
  const {
    data: attendance,
    loading: attendanceLoading,
    reload: reloadAttendance,
  } = useCollection('attendance')
  const { data: payments, loading: paymentsLoading } = useCollection('payments')

  const [editOpen, setEditOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [savingStudents, setSavingStudents] = useState(false)

  const course = useMemo(
    () => courses.find((item) => String(item.id) === String(group?.courseId)),
    [courses, group?.courseId],
  )
  const teacher = useMemo(
    () => teachers.find((item) => String(item.id) === String(group?.teacherId)),
    [teachers, group?.teacherId],
  )

  const members = useMemo(() => {
    if (!group) return []
    const ids = new Set((group.studentIds || []).map(String))
    students.forEach((student) => {
      if (String(student.groupId) === String(group.id)) ids.add(String(student.id))
    })
    return students
      .filter((student) => ids.has(String(student.id)))
      .sort((a, b) => fullName(a).localeCompare(fullName(b)))
  }, [students, group])

  const memberIds = useMemo(() => members.map((member) => String(member.id)), [members])

  const groupAttendance = useMemo(
    () => attendance.filter((record) => String(record.groupId) === String(id)),
    [attendance, id],
  )
  const attendanceSummary = useMemo(() => attendanceStats(groupAttendance), [groupAttendance])
  const attendanceDays = useMemo(() => attendanceByDate(groupAttendance), [groupAttendance])

  const groupPayments = useMemo(
    () =>
      payments
        .filter((payment) => memberIds.includes(String(payment.studentId)))
        .sort((a, b) => String(b.month || '').localeCompare(String(a.month || ''))),
    [payments, memberIds],
  )
  const totals = useMemo(() => paymentTotals(groupPayments), [groupPayments])
  const monthlyFees = useMemo(
    () => members.reduce((total, member) => total + Number(member.monthlyFee || 0), 0),
    [members],
  )

  const isLoading =
    loading ||
    studentsLoading ||
    coursesLoading ||
    teachersLoading ||
    groupsLoading ||
    attendanceLoading ||
    paymentsLoading

  const availableStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    return [...students]
      .filter((student) => {
        if (!searchValue) return true
        return `${student.firstName} ${student.lastName} ${student.phone}`
          .toLowerCase()
          .includes(searchValue)
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)))
  }, [students, search])

  if (isLoading) return <DetailSkeleton />

  if (error || !group) {
    return (
      <ErrorState
        title="Guruh topilmadi"
        description="Bu ID bo'yicha guruh mavjud emas yoki ma'lumotlar bazasidan o'chirilgan."
        onRetry={reload}
      />
    )
  }

  const bannerStyle = COLOR_BANNERS[course?.color] || COLOR_BANNERS.violet

  function openManage() {
    setSelectedIds((group.studentIds || []).map(String))
    setSearch('')
    setManageOpen(true)
  }

  function toggleStudent(studentId) {
    const key = String(studentId)
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    )
  }

  async function handleSave(values) {
    setSubmitting(true)
    try {
      await api.update('groups', group.id, {
        ...group,
        ...values,
        id: group.id,
        studentIds: group.studentIds || [],
      })
      toast.success('Guruh yangilandi', values.name)
      setEditOpen(false)
      reload()
      reloadGroups()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveStudents() {
    setSavingStudents(true)
    try {
      await syncGroupStudents({
        group,
        nextStudentIds: selectedIds,
        groups,
        students,
      })
      toast.success("Guruh tarkibi yangilandi", `${selectedIds.length} ta o'quvchi`)
      setManageOpen(false)
      reload()
      reloadStudents()
      reloadGroups()
      reloadAttendance()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSavingStudents(false)
    }
  }

  async function handleRemoveStudent(member) {
    const approved = await confirm({
      title: "O'quvchini guruhdan chiqarish",
      description: `“${fullName(member)}” guruhdan chiqariladi. O'quvchi profilida guruh bo'sh bo'ladi.`,
      confirmLabel: 'Chiqarish',
    })
    if (!approved) return
    try {
      await syncGroupStudents({
        group,
        nextStudentIds: memberIds.filter((item) => item !== String(member.id)),
        groups,
        students,
      })
      toast.success("O'quvchi guruhdan chiqarildi", fullName(member))
      reload()
      reloadStudents()
      reloadGroups()
    } catch (err) {
      toast.error('Amalni bajarishda xatolik', err.message)
    }
  }

  async function handleDelete() {
    const approved = await confirm({
      title: "Guruhni o'chirish",
      description: `“${group.name}” guruhi va ${groupAttendance.length} ta davomat yozuvi o'chiriladi. O'quvchilar saqlanadi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await detachGroupRelations({ group, students })
      await Promise.all(groupAttendance.map((record) => api.remove('attendance', record.id)))
      await api.remove('groups', group.id)
      toast.success("Guruh o'chirildi", group.name)
      navigate(ROUTES.groups)
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
        to={ROUTES.groups}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <HiOutlineArrowRight className="size-3.5 rotate-180" />
        Guruhlar ro'yxati
      </Link>

      <div className="card overflow-hidden">
        <div className={`relative h-28 ${bannerStyle} sm:h-32`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(59,130,246,0.35),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur">
            ID #{group.id}
          </span>
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4 sm:gap-5">
              <span className="-mt-10 flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-[var(--surface)] bg-brand-50 text-brand-600 shadow-sm sm:-mt-12 sm:size-24 dark:bg-brand-500/10 dark:text-brand-300">
                <HiOutlineAcademicCap className="size-9" />
              </span>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-extrabold tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
                  {group.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <GroupStatusBadge status={group.status} />
                  <LevelBadge level={group.level} />
                  <span className="chip">
                    <HiOutlineCalendarDays className="size-3" />
                    {group.days}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-1">
              <Button variant="secondary" size="sm" icon={HiOutlinePlus} onClick={openManage}>
                O'quvchi qo'shish
              </Button>
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
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineAcademicCap className="size-3.5" />
              {course?.name || 'Kurs tanlanmagan'}
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineClock className="size-3.5" />
              {group.time}
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineMapPin className="size-3.5" />
              {group.room}-xona
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineCalendarDays className="size-3.5" />
              {formatDate(group.startDate)} dan
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="O'quvchilar"
          value={members.length}
          icon={HiOutlineUsers}
          tone="brand"
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
          hint={`${attendanceDays.length} dars`}
        />
        <QuickStat
          label="Oylik to'lovlar"
          value={formatCurrency(monthlyFees, { compact: true })}
          icon={HiOutlineWallet}
          tone="violet"
        />
        <QuickStat
          label="Qarzdorlik"
          value={formatCurrency(totals.debt, { compact: true })}
          icon={HiOutlineBanknotes}
          tone={totals.debt > 0 ? 'rose' : 'emerald'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Guruh o'quvchilari"
          description={`${members.length} ta o'quvchi guruhga biriktirilgan`}
          className="xl:col-span-2"
          noPadding
          action={
            <Button size="sm" variant="secondary" icon={HiOutlinePlus} onClick={openManage}>
              Boshqarish
            </Button>
          }
        >
          {members.length === 0 ? (
            <EmptyState
              compact
              icon={HiOutlineUserGroup}
              title="Guruhda o'quvchilar yo'q"
              description="O'quvchilarni guruhga qo'shish uchun boshqarish tugmasidan foydalaning."
              action={
                <Button size="sm" variant="primary" icon={HiOutlinePlus} onClick={openManage}>
                  O'quvchi qo'shish
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--surface-2)] sm:px-6"
                >
                  <Avatar
                    firstName={member.firstName}
                    lastName={member.lastName}
                    src={member.photo}
                    size="sm"
                  />
                  <Link to={ROUTES.student(member.id)} className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                      {fullName(member)}
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] text-subtle">
                      {member.phone} · {member.level}
                    </p>
                  </Link>
                  <PaymentStatusBadge status={member.paymentStatus} short />
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(member)}
                    aria-label={`${fullName(member)} ni guruhdan chiqarish`}
                    className="icon-btn icon-btn-sm shrink-0 hover:!text-rose-500"
                  >
                    <HiOutlineXMark className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title="Dars jadvali"
            description="Haftalik reja"
            action={
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                <HiOutlineCalendarDays className="size-4" />
              </span>
            }
          >
            <div className="space-y-2.5">
              <InfoRow label="Kunlar" value={group.days} />
              <InfoRow label="Vaqt" icon={HiOutlineClock} value={group.time} />
              <InfoRow label="Xona" icon={HiOutlineMapPin} value={`${group.room}-xona`} />
              <InfoRow
                label="O'qituvchi"
                icon={HiOutlineUserGroup}
                value={
                  teacher ? (
                    <Link
                      to={ROUTES.teacher(teacher.id)}
                      className="text-brand-600 hover:opacity-75 dark:text-brand-300"
                    >
                      {fullName(teacher)}
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow
                label="Kurs"
                icon={HiOutlineAcademicCap}
                value={course?.name || '—'}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Davomat xulosasi"
            description={`${attendanceSummary.total} ta yozuv asosida`}
            action={
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <HiOutlineClock className="size-4" />
              </span>
            }
          >
            <DonutChart
              data={donutData}
              size={132}
              stroke={13}
              centerValue={`${attendanceSummary.rate}%`}
              centerLabel="Davomat"
              legendClassName="space-y-2"
            />
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Dars tarixi"
          description="Oxirgi davomat yozuvlari kunlar bo'yicha"
          className="xl:col-span-2"
          noPadding
          action={
            <Link
              to={ROUTES.attendance}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:opacity-75 dark:text-brand-300"
            >
              Davomat bo'limi
              <HiOutlineArrowRight className="size-3.5" />
            </Link>
          }
        >
          {attendanceDays.length === 0 ? (
            <EmptyState
              compact
              icon={HiOutlineClock}
              title="Davomat yozuvlari yo'q"
              description="Bu guruh uchun hali davomat belgilanmagan."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Keldi</th>
                    <th>Kechikdi</th>
                    <th>Kelmadi</th>
                    <th>Davomat</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceDays.slice(0, 8).map((day) => (
                    <tr key={day.date}>
                      <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                        {formatDate(day.date, { withYear: false })}
                      </td>
                      <td className="text-emerald-600 dark:text-emerald-400">{day.present}</td>
                      <td className="text-amber-600 dark:text-amber-400">{day.late}</td>
                      <td className="text-rose-600 dark:text-rose-400">{day.absent}</td>
                      <td className="font-semibold text-[var(--text)]">{day.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="To'lovlar"
          description={`${groupPayments.length} ta yozuv · ${formatCurrency(totals.paid, {
            compact: true,
          })} to'langan`}
          noPadding
        >
          {groupPayments.length === 0 ? (
            <EmptyState
              compact
              icon={HiOutlineBanknotes}
              title="To'lovlar yo'q"
              description="Guruh o'quvchilari uchun to'lov yozuvlari topilmadi."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {groupPayments.slice(0, 6).map((payment) => {
                const member = members.find(
                  (item) => String(item.id) === String(payment.studentId),
                )
                return (
                  <div key={payment.id} className="flex items-center gap-2 px-5 py-2.5 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-[var(--text)]">
                        {member ? fullName(member) : '—'}
                      </p>
                      <p className="text-[10px] text-subtle">{monthLabel(payment.month)}</p>
                    </div>
                    <PaymentStatusBadge status={payment.status} short />
                    <span className="text-[11px] font-bold whitespace-nowrap text-[var(--text)]">
                      {formatCurrency(payment.amount, { compact: true })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="lg"
        title="Guruh ma'lumotlarini tahrirlash"
        description={`${group.name} guruhi ma'lumotlarini yangilang.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" form="group-detail-form" variant="primary" loading={submitting}>
              Saqlash
            </Button>
          </>
        }
      >
        <GroupForm
          formId="group-detail-form"
          initialValues={group}
          courses={courses}
          teachers={teachers}
          onSubmit={handleSave}
        />
      </Modal>

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        size="lg"
        title="Guruh o'quvchilarini boshqarish"
        description="Belgilangan o'quvchilar guruhga biriktiriladi. Boshqa guruhdagi o'quvchi tanlansa, u avtomatik ko'chiriladi."
        footer={
          <>
            <Button variant="secondary" onClick={() => setManageOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" loading={savingStudents} onClick={handleSaveStudents}>
              Saqlash ({selectedIds.length})
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            className="input"
            placeholder="O'quvchi ismi yoki telefoni bo'yicha qidirish..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2">
            {availableStudents.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-subtle">
                Qidiruv bo'yicha o'quvchi topilmadi.
              </p>
            ) : (
              <div className="space-y-1">
                {availableStudents.map((student) => {
                  const checked = selectedIds.includes(String(student.id))
                  const otherGroup = groups.find(
                    (item) =>
                      String(item.id) !== String(group.id) &&
                      String(item.id) === String(student.groupId),
                  )
                  return (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-[var(--surface-3)]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(student.id)}
                        className="size-4 shrink-0 cursor-pointer rounded border-[var(--border-strong)] accent-brand-600"
                      />
                      <Avatar
                        firstName={student.firstName}
                        lastName={student.lastName}
                        src={student.photo}
                        size="xs"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-[var(--text)]">
                          {fullName(student)}
                        </span>
                        <span className="block truncate text-[10px] text-subtle">
                          {student.level}
                          {otherGroup ? ` · hozir ${otherGroup.name}` : ''}
                        </span>
                      </span>
                      <PaymentStatusBadge status={student.paymentStatus} short />
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          <p className="text-[11px] text-subtle">
            Tanlangan: <span className="font-bold text-[var(--text)]">{selectedIds.length}</span> ta
          </p>
        </div>
      </Modal>
    </div>
  )
}
