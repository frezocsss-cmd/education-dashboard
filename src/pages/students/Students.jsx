import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineExclamationCircle,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlineUserPlus,
  HiOutlineUsers,
} from 'react-icons/hi2'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import SearchInput from '@/components/common/SearchInput'
import QuickStat from '@/components/common/QuickStat'
import Modal from '@/components/common/Modal'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import { CardGridSkeleton } from '@/components/common/Skeleton'
import StudentCard from '@/components/cards/StudentCard'
import StudentForm from '@/components/forms/StudentForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { LEVELS, PAGE_SIZE, STUDENT_SORT_OPTIONS } from '@/utils/constants'
import { levelIndex } from '@/utils/stats'
import { monthKey } from '@/utils/format'
import { detachStudentRelations, syncStudentRelations } from '@/utils/relations'

const EMPTY_FILTERS = { search: '', course: '', group: '', level: '', sort: 'newest' }

export default function Students() {
  const { data: students, loading, error, reload } = useCollection('students')
  const { data: courses } = useCollection('courses')
  const { data: groups, reload: reloadGroups } = useCollection('groups')
  const { data: parents, reload: reloadParents } = useCollection('parents')

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const courseMap = useMemo(() => new Map(courses.map((item) => [String(item.id), item])), [courses])
  const groupMap = useMemo(() => new Map(groups.map((item) => [String(item.id), item])), [groups])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    let list = students.filter((student) => {
      const matchesSearch =
        !search ||
        `${student.firstName} ${student.lastName} ${student.phone} ${student.parentName}`
          .toLowerCase()
          .includes(search)
      const matchesCourse = !filters.course || String(student.courseId) === filters.course
      const matchesGroup = !filters.group || String(student.groupId) === filters.group
      const matchesLevel = !filters.level || student.level === filters.level
      return matchesSearch && matchesCourse && matchesGroup && matchesLevel
    })

    list = [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'name-asc':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'name-desc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
        case 'level-asc':
          return levelIndex(a.level) - levelIndex(b.level)
        case 'level-desc':
          return levelIndex(b.level) - levelIndex(a.level)
        case 'newest':
        default:
          return String(b.enrollmentDate).localeCompare(String(a.enrollmentDate))
      }
    })

    return list
  }, [students, debouncedSearch, filters.course, filters.group, filters.level, filters.sort])

  const stats = useMemo(() => {
    const current = monthKey(new Date())
    return {
      total: students.length,
      paid: students.filter((student) => student.paymentStatus === 'paid').length,
      partial: students.filter((student) => student.paymentStatus === 'partial').length,
      unpaid: students.filter((student) => student.paymentStatus === 'unpaid').length,
      newThisMonth: students.filter((student) => monthKey(student.enrollmentDate) === current).length,
    }
  }, [students])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.students))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.students
    return filtered.slice(start, start + PAGE_SIZE.students)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.course, filters.group, filters.level, filters.sort])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null)
      setModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const activeFilters =
    Boolean(debouncedSearch) || Boolean(filters.course) || Boolean(filters.group) || Boolean(filters.level)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(student) {
    setEditing(student)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(values) {
    setSubmitting(true)
    try {
      if (editing) {
        const { id: _id, ...payload } = { ...editing, ...values }
        await api.update('students', editing.id, { ...payload, id: editing.id })
        await syncStudentRelations({
          previous: editing,
          next: { ...values, id: editing.id },
          groups,
          parents,
        })
        toast.success("O'quvchi ma'lumotlari yangilandi", `${values.firstName} ${values.lastName}`)
      } else {
        const created = await api.create('students', values)
        await syncStudentRelations({ previous: null, next: created, groups, parents })
        toast.success("Yangi o'quvchi qo'shildi", `${values.firstName} ${values.lastName}`)
      }
      reload()
      reloadGroups()
      reloadParents()
      closeModal()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(student) {
    const approved = await confirm({
      title: "O'quvchini o'chirish",
      description: `“${student.firstName} ${student.lastName}” butunlay o'chiriladi. Unga tegishli davomat va to'lov yozuvlari ham o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      const [studentAttendance, studentPayments] = await Promise.all([
        api.list('attendance', { studentId: student.id }),
        api.list('payments', { studentId: student.id }),
      ])
      await detachStudentRelations({ student, groups, parents })
      await api.remove('students', student.id)
      await Promise.all([
        ...studentAttendance.map((item) => api.remove('attendance', item.id)),
        ...studentPayments.map((item) => api.remove('payments', item.id)),
      ])
      toast.success("O'quvchi o'chirildi", `${student.firstName} ${student.lastName}`)
      reload()
      reloadGroups()
      reloadParents()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  const groupOptions = useMemo(
    () =>
      filters.course
        ? groups.filter((group) => String(group.courseId) === filters.course)
        : groups,
    [groups, filters.course],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="O'quvchilar"
        description="Barcha o'quvchilarni boshqaring: qidiruv, filtr, guruhlar va to'lov holati bo'yicha nazorat."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi o'quvchi
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat label="Jami o'quvchi" value={stats.total} icon={HiOutlineUsers} tone="brand" loading={loading} />
        <QuickStat
          label="To'langan"
          value={stats.paid}
          icon={HiOutlineBanknotes}
          tone="emerald"
          loading={loading}
        />
        <QuickStat
          label="Qisman to'lagan"
          value={stats.partial}
          icon={HiOutlineBanknotes}
          tone="amber"
          loading={loading}
        />
        <QuickStat
          label="Qarzdorlar"
          value={stats.unpaid}
          icon={HiOutlineExclamationCircle}
          tone="rose"
          hint={`${stats.newThisMonth} yangi`}
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            placeholder="Ism, familiya, telefon yoki ota-ona bo'yicha qidirish..."
            className="lg:max-w-md lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center">
            <select
              className="input select"
              value={filters.course}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, course: event.target.value, group: '' }))
              }
              aria-label="Kurs bo'yicha filtr"
            >
              <option value="">Barcha kurslar</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            <select
              className="input select"
              value={filters.group}
              onChange={(event) => setFilters((prev) => ({ ...prev, group: event.target.value }))}
              aria-label="Guruh bo'yicha filtr"
            >
              <option value="">Barcha guruhlar</option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              className="input select"
              value={filters.level}
              onChange={(event) => setFilters((prev) => ({ ...prev, level: event.target.value }))}
              aria-label="Daraja bo'yicha filtr"
            >
              <option value="">Barcha darajalar</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              className="input select"
              value={filters.sort}
              onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
              aria-label="Saralash"
            >
              {STUDENT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {activeFilters && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="btn btn-ghost col-span-2 !px-3 sm:col-span-1"
              >
                <HiOutlineFunnel className="size-4" />
                Tozalash
              </button>
            )}
          </div>
        </div>
        {activeFilters && !loading && (
          <p className="mt-3 text-[11px] text-subtle">
            {filtered.length} ta natija topildi
            {filters.course ? ` · ${courseMap.get(filters.course)?.name || ''}` : ''}
          </p>
        )}
      </div>

      {error ? (
        <ErrorState onRetry={reload} description={error} />
      ) : loading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HiOutlineAcademicCap}
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha o'quvchilar yo'q"}
            description={
              activeFilters
                ? "Qidiruv yoki filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Birinchi o'quvchini qo'shish uchun quyidagi tugmani bosing."
            }
            action={
              activeFilters ? (
                <Button variant="secondary" icon={HiOutlineFunnel} onClick={() => setFilters(EMPTY_FILTERS)}>
                  Filtrni tozalash
                </Button>
              ) : (
                <Button variant="primary" icon={HiOutlineUserPlus} onClick={openCreate}>
                  O'quvchi qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                course={courseMap.get(String(student.courseId))}
                group={groupMap.get(String(student.groupId))}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.students}
            total={filtered.length}
            onChange={setPage}
            className="pt-1"
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="lg"
        title={editing ? "O'quvchi ma'lumotlarini tahrirlash" : "Yangi o'quvchi qo'shish"}
        description={
          editing
            ? `${editing.firstName} ${editing.lastName} ma'lumotlarini yangilang.`
            : "O'quvchi haqidagi barcha ma'lumotlarni to'ldiring. Yulduzcha bilan belgilangan maydonlar majburiy."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="student-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <StudentForm
          key={editing?.id ?? 'new'}
          initialValues={editing}
          parents={parents}
          courses={courses}
          groups={groups}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
