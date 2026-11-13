import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineEnvelope,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineRectangleGroup,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import Modal from '@/components/common/Modal'
import { DetailSkeleton } from '@/components/common/Skeleton'
import { InfoRow, SectionCard } from '@/components/common/SectionCard'
import QuickStat from '@/components/common/QuickStat'
import { PersonStatusBadge } from '@/components/common/EntityBadges'
import TeacherForm from '@/components/forms/TeacherForm'
import { useCollection, useRecord } from '@/hooks/useApi'
import { api } from '@/services/api'
import { detachTeacherRelation } from '@/utils/relations'
import { confirm } from '@/store/confirmStore'
import { toast } from '@/store/toastStore'
import { formatCurrency, formatDate, formatPhone } from '@/utils/format'
import { ROUTES } from '@/routes/paths'

export default function TeacherDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: teacher, loading, error, reload } = useRecord('teachers', id)
  const { data: groups, loading: groupsLoading } = useCollection('groups')
  const { data: courses, loading: coursesLoading } = useCollection('courses')

  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const assignedGroups = useMemo(
    () => groups.filter((group) => String(group.teacherId) === String(id)),
    [groups, id],
  )
  const courseMap = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course])),
    [courses],
  )
  const studentCount = useMemo(() => {
    const ids = new Set()
    assignedGroups.forEach((group) => {
      ;(group.studentIds || []).forEach((studentId) => ids.add(String(studentId)))
    })
    return ids.size
  }, [assignedGroups])

  if (loading || groupsLoading || coursesLoading) {
    return <DetailSkeleton />
  }

  if (error || !teacher) {
    return (
      <ErrorState
        title="O'qituvchi topilmadi"
        description="Bu ID bo'yicha o'qituvchi mavjud emas yoki o'chirilgan."
        onRetry={reload}
      />
    )
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`

  async function handleSave(values) {
    setSubmitting(true)
    try {
      await api.update('teachers', teacher.id, { ...teacher, ...values, id: teacher.id })
      toast.success("O'qituvchi yangilandi", `${values.firstName} ${values.lastName}`)
      setEditOpen(false)
      reload()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    const approved = await confirm({
      title: "O'qituvchini o'chirish",
      description: `“${fullName}” o'chiriladi. Biriktirilgan guruhlarda o'qituvchi bo'shatiladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await detachTeacherRelation({ teacher, groups })
      await Promise.all(
        courses
          .filter((course) => (course.teacherIds || []).map(String).includes(String(teacher.id)))
          .map((course) =>
            api.patch('courses', course.id, {
              teacherIds: course.teacherIds.filter(
                (teacherId) => String(teacherId) !== String(teacher.id),
              ),
            }),
          ),
      )
      await api.remove('teachers', teacher.id)
      toast.success("O'qituvchi o'chirildi", fullName)
      navigate(ROUTES.teachers)
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to={ROUTES.teachers}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
      >
        <HiOutlineArrowRight className="size-3.5 rotate-180" />
        O'qituvchilar ro'yxati
      </Link>

      <div className="card overflow-hidden">
        <div className="relative h-28 bg-[linear-gradient(110deg,#3730a3,#6d34ec_55%,#9333ea)] sm:h-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_85%_75%,rgba(14,165,233,0.3),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur">
            ID #{teacher.id}
          </span>
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4 sm:gap-5">
              <Avatar
                firstName={teacher.firstName}
                lastName={teacher.lastName}
                src={teacher.photo}
                size="2xl"
                status={teacher.status}
                className="-mt-12 shrink-0 sm:-mt-14"
                ring
              />
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-extrabold tracking-[-0.035em] text-[var(--text)] sm:text-2xl">
                  {fullName}
                </h1>
                <p className="mt-1 text-[12.5px] font-semibold text-brand-600 dark:text-brand-300">
                  {teacher.specialization}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PersonStatusBadge status={teacher.status} />
                  <span className="chip">
                    <HiOutlineRectangleGroup className="size-3" />
                    {assignedGroups.length} guruh
                  </span>
                  <span className="chip">
                    <HiOutlineAcademicCap className="size-3" />
                    {teacher.experience} yil tajriba
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
              href={`tel:${teacher.phone}`}
              className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
            >
              <HiOutlinePhone className="size-3.5" />
              {formatPhone(teacher.phone)}
            </a>
            <a
              href={`mailto:${teacher.email}`}
              className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
            >
              <HiOutlineEnvelope className="size-3.5" />
              {teacher.email}
            </a>
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <HiOutlineCalendarDays className="size-3.5" />
              {formatDate(teacher.joinDate)} dan beri
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Guruhlar"
          value={assignedGroups.length}
          icon={HiOutlineRectangleGroup}
          tone="brand"
        />
        <QuickStat label="O'quvchilar" value={studentCount} icon={HiOutlineUsers} tone="violet" />
        <QuickStat
          label="Tajriba"
          value={`${teacher.experience} yil`}
          icon={HiOutlineAcademicCap}
          tone="sky"
        />
        <QuickStat
          label="Oylik maosh"
          value={formatCurrency(teacher.salary, { compact: true })}
          icon={HiOutlineBanknotes}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Aloqa ma'lumotlari"
          description="O'qituvchi bilan bog'lanish"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <HiOutlinePhone className="size-4" />
            </span>
          }
        >
          <div className="space-y-2.5">
            <InfoRow label="Telefon" icon={HiOutlinePhone} value={formatPhone(teacher.phone)} />
            <InfoRow label="Email" icon={HiOutlineEnvelope} value={teacher.email} />
            <InfoRow
              label="Ishga qabul sanasi"
              icon={HiOutlineCalendarDays}
              value={formatDate(teacher.joinDate)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Kasbiy ma'lumotlar"
          description="Lavozim va tajriba"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <HiOutlineAcademicCap className="size-4" />
            </span>
          }
        >
          <div className="space-y-2.5">
            <InfoRow label="Mutaxassislik" value={teacher.specialization} />
            <InfoRow label="Tajriba" value={`${teacher.experience} yil`} />
            <InfoRow label="Maosh" value={formatCurrency(teacher.salary)} />
            <InfoRow label="Holat" value={<PersonStatusBadge status={teacher.status} />} />
          </div>
        </SectionCard>

        <SectionCard
          title="Izohlar"
          description="Administrator eslatmalari"
          action={
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <HiOutlineUserGroup className="size-4" />
            </span>
          }
        >
          <p className="text-[12.5px] leading-relaxed text-muted">
            {teacher.notes || "Bu o'qituvchi uchun qo'shimcha izoh kiritilmagan."}
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Biriktirilgan guruhlar"
        description={`${assignedGroups.length} ta guruh · ${studentCount} nafar o'quvchi`}
      >
        {assignedGroups.length === 0 ? (
          <EmptyState
            compact
            icon={HiOutlineRectangleGroup}
            title="Guruhlar biriktirilmagan"
            description="Guruhlar bo'limida ushbu o'qituvchini guruhga biriktirishingiz mumkin."
            action={
              <Link to={ROUTES.groups} className="btn btn-secondary btn-sm">
                Guruhlar bo'limiga o'tish
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {assignedGroups.map((group) => {
              const course = courseMap.get(String(group.courseId))
              return (
                <Link
                  key={group.id}
                  to={ROUTES.group(group.id)}
                  className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-all hover:border-brand-300/70 hover:bg-[var(--surface)] dark:hover:border-brand-400/30"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    <HiOutlineRectangleGroup className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-[var(--text)]">
                      {group.name}
                    </span>
                    <span className="block truncate text-[10.5px] text-subtle">
                      {course?.name || 'Kurs'} · {group.days}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-muted">
                    <HiOutlineUsers className="size-3.5" />
                    {(group.studentIds || []).length}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </SectionCard>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="lg"
        title="O'qituvchi ma'lumotlarini tahrirlash"
        description={`${fullName} profili ma'lumotlarini yangilang.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" form="teacher-detail-form" variant="primary" loading={submitting}>
              Saqlash
            </Button>
          </>
        }
      >
        <TeacherForm
          formId="teacher-detail-form"
          initialValues={teacher}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
