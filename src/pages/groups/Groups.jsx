import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlineRectangleGroup,
  HiOutlineSparkles,
  HiOutlineUserGroup,
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
import GroupCard from '@/components/cards/GroupCard'
import GroupForm from '@/components/forms/GroupForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { GROUP_STATUS, PAGE_SIZE } from '@/utils/constants'
import { detachGroupRelations } from '@/utils/relations'

const EMPTY_FILTERS = { search: '', course: '', teacher: '', status: '', sort: 'newest' }

const SORT_OPTIONS = [
  { value: 'newest', label: 'Yangi boshlangan' },
  { value: 'name-asc', label: 'Nomi (A → Z)' },
  { value: 'name-desc', label: 'Nomi (Z → A)' },
  { value: 'students-desc', label: "O'quvchilar (ko'p → kam)" },
]

export default function Groups() {
  const { data: groups, loading, error, reload } = useCollection('groups')
  const { data: courses } = useCollection('courses')
  const { data: teachers } = useCollection('teachers')
  const { data: students, reload: reloadStudents } = useCollection('students')

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const courseMap = useMemo(
    () => new Map(courses.map((course) => [String(course.id), course])),
    [courses],
  )
  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [String(teacher.id), teacher])),
    [teachers],
  )

  const studentCounts = useMemo(() => {
    const map = new Map()
    groups.forEach((group) => {
      map.set(
        String(group.id),
        students.filter((student) => String(student.groupId) === String(group.id)).length,
      )
    })
    return map
  }, [groups, students])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    const list = groups.filter((group) => {
      const matchesSearch =
        !search ||
        `${group.name} ${group.room} ${courseMap.get(String(group.courseId))?.name || ''}`
          .toLowerCase()
          .includes(search)
      const matchesCourse = !filters.course || String(group.courseId) === filters.course
      const matchesTeacher = !filters.teacher || String(group.teacherId) === filters.teacher
      const matchesStatus = !filters.status || group.status === filters.status
      return matchesSearch && matchesCourse && matchesTeacher && matchesStatus
    })

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'students-desc':
          return (
            (studentCounts.get(String(b.id)) || 0) - (studentCounts.get(String(a.id)) || 0)
          )
        case 'newest':
        default:
          return String(b.startDate).localeCompare(String(a.startDate))
      }
    })
  }, [
    groups,
    courseMap,
    studentCounts,
    debouncedSearch,
    filters.course,
    filters.teacher,
    filters.status,
    filters.sort,
  ])

  const stats = useMemo(
    () => ({
      total: groups.length,
      active: groups.filter((group) => group.status === 'active').length,
      planned: groups.filter((group) => group.status === 'planned').length,
      students: students.filter((student) => student.groupId).length,
    }),
    [groups, students],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.groups))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.groups
    return filtered.slice(start, start + PAGE_SIZE.groups)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.course, filters.teacher, filters.status, filters.sort])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    const course = searchParams.get('course') || ''
    if (course) setFilters((prev) => ({ ...prev, course }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
    Boolean(debouncedSearch) ||
    Boolean(filters.course) ||
    Boolean(filters.teacher) ||
    Boolean(filters.status)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(group) {
    setEditing(group)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(values) {
    const duplicate = groups.find(
      (group) =>
        String(group.id) !== String(editing?.id) &&
        group.name.trim().toLowerCase() === values.name.trim().toLowerCase(),
    )
    if (duplicate) {
      toast.error('Guruh allaqachon mavjud', `“${duplicate.name}” nomi band. Boshqa nom tanlang.`)
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await api.update('groups', editing.id, {
          ...editing,
          ...values,
          id: editing.id,
          studentIds: editing.studentIds || [],
        })
        toast.success('Guruh yangilandi', values.name)
      } else {
        await api.create('groups', { ...values, studentIds: [] })
        toast.success("Yangi guruh qo'shildi", values.name)
      }
      reload()
      closeModal()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(group) {
    const approved = await confirm({
      title: "Guruhni o'chirish",
      description: `“${group.name}” guruhi va uning davomat tarixi o'chiriladi. O'quvchilar saqlanadi, faqat guruhdan chiqariladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      const groupAttendance = await api.list('attendance', { groupId: group.id })
      await detachGroupRelations({ group, students })
      await Promise.all(groupAttendance.map((item) => api.remove('attendance', item.id)))
      await api.remove('groups', group.id)
      toast.success("Guruh o'chirildi", group.name)
      reload()
      reloadStudents()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Guruhlar"
        description="Dars jadvali, o'qituvchilar, xonalar va o'quvchilar taqsimoti."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi guruh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Jami guruh"
          value={stats.total}
          icon={HiOutlineRectangleGroup}
          tone="brand"
          loading={loading}
        />
        <QuickStat
          label="Faol guruh"
          value={stats.active}
          icon={HiOutlineCalendarDays}
          tone="emerald"
          loading={loading}
        />
        <QuickStat
          label="Rejalashtirilgan"
          value={stats.planned}
          icon={HiOutlineSparkles}
          tone="sky"
          loading={loading}
        />
        <QuickStat
          label="Guruhdagi o'quvchi"
          value={stats.students}
          icon={HiOutlineUserGroup}
          tone="violet"
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            placeholder="Guruh nomi, kurs yoki xona bo'yicha qidirish..."
            className="lg:max-w-sm lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center">
            <select
              className="input select"
              value={filters.course}
              onChange={(event) => setFilters((prev) => ({ ...prev, course: event.target.value }))}
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
              value={filters.teacher}
              onChange={(event) => setFilters((prev) => ({ ...prev, teacher: event.target.value }))}
              aria-label="O'qituvchi bo'yicha filtr"
            >
              <option value="">Barcha o'qituvchilar</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>
            <select
              className="input select"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              aria-label="Holat bo'yicha filtr"
            >
              <option value="">Barcha holatlar</option>
              {Object.entries(GROUP_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <select
              className="input select"
              value={filters.sort}
              onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
              aria-label="Saralash"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {activeFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY_FILTERS)
                  setSearchParams({}, { replace: true })
                }}
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
            icon={HiOutlineRectangleGroup}
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha guruhlar yo'q"}
            description={
              activeFilters
                ? "Qidiruv yoki filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Birinchi guruhni qo'shish uchun quyidagi tugmani bosing."
            }
            action={
              activeFilters ? (
                <Button
                  variant="secondary"
                  icon={HiOutlineFunnel}
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    setSearchParams({}, { replace: true })
                  }}
                >
                  Filtrni tozalash
                </Button>
              ) : (
                <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
                  Guruh qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                course={courseMap.get(String(group.courseId))}
                teacher={teacherMap.get(String(group.teacherId))}
                studentCount={studentCounts.get(String(group.id)) || 0}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.groups}
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
        title={editing ? "Guruh ma'lumotlarini tahrirlash" : "Yangi guruh qo'shish"}
        description={
          editing
            ? `${editing.name} guruhi ma'lumotlarini yangilang.`
            : "Guruh nomi, kursi, o'qituvchisi va dars jadvalini belgilang."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="group-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <GroupForm
          key={editing?.id ?? 'new'}
          initialValues={editing}
          courses={courses}
          teachers={teachers}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
