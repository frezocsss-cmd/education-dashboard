import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlineRectangleGroup,
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
import CourseCard from '@/components/cards/CourseCard'
import CourseForm from '@/components/forms/CourseForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { COURSE_COLORS, PAGE_SIZE } from '@/utils/constants'
import { formatCurrency } from '@/utils/format'

const EMPTY_FILTERS = { search: '', color: '', sort: 'name-asc' }

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nomi (A → Z)' },
  { value: 'name-desc', label: 'Nomi (Z → A)' },
  { value: 'price-desc', label: 'Narx (yuqori → past)' },
  { value: 'price-asc', label: 'Narx (past → yuqori)' },
  { value: 'groups-desc', label: 'Guruhlar soni' },
]

export default function Courses() {
  const { data: courses, loading, error, reload } = useCollection('courses')
  const { data: groups, reload: reloadGroups } = useCollection('groups')
  const { data: students } = useCollection('students')
  const { data: teachers } = useCollection('teachers')

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const teacherMap = useMemo(
    () => new Map(teachers.map((teacher) => [String(teacher.id), teacher])),
    [teachers],
  )

  const stats = useMemo(() => {
    const activeGroups = groups.filter((group) => group.status === 'active').length
    const avgPrice = courses.length
      ? Math.round(courses.reduce((total, course) => total + Number(course.price || 0), 0) / courses.length)
      : 0
    return {
      courses: courses.length,
      groups: activeGroups,
      students: students.filter((student) => student.courseId).length,
      avgPrice,
    }
  }, [courses, groups, students])

  const courseCounts = useMemo(() => {
    const map = new Map()
    courses.forEach((course) => {
      map.set(String(course.id), {
        groups: groups.filter((group) => String(group.courseId) === String(course.id)).length,
        students: students.filter((student) => String(student.courseId) === String(course.id)).length,
      })
    })
    return map
  }, [courses, groups, students])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    const list = courses.filter((course) => {
      const matchesSearch =
        !search || `${course.name} ${course.description}`.toLowerCase().includes(search)
      const matchesColor = !filters.color || course.color === filters.color
      return matchesSearch && matchesColor
    })

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-desc':
          return Number(b.price) - Number(a.price)
        case 'price-asc':
          return Number(a.price) - Number(b.price)
        case 'groups-desc':
          return (
            (courseCounts.get(String(b.id))?.groups || 0) -
            (courseCounts.get(String(a.id))?.groups || 0)
          )
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [courses, courseCounts, debouncedSearch, filters.color, filters.sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.courses))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.courses
    return filtered.slice(start, start + PAGE_SIZE.courses)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.color, filters.sort])

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

  const activeFilters = Boolean(debouncedSearch) || Boolean(filters.color)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(course) {
    setEditing(course)
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
        await api.update('courses', editing.id, { ...editing, ...values, id: editing.id })
        toast.success('Kurs yangilandi', values.name)
      } else {
        await api.create('courses', values)
        toast.success("Yangi kurs qo'shildi", values.name)
      }
      reload()
      closeModal()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(course) {
    const related = groups.filter((group) => String(group.courseId) === String(course.id))
    if (related.length) {
      toast.error(
        "Kursni o'chirib bo'lmaydi",
        `Avval ${related.length} ta guruhni boshqa kursga o'tkazing yoki o'chiring.`,
      )
      return
    }

    const approved = await confirm({
      title: "Kursni o'chirish",
      description: `“${course.name}” kursi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await api.remove('courses', course.id)
      toast.success("Kurs o'chirildi", course.name)
      reload()
      reloadGroups()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kurslar"
        description="Ta'lim yo'nalishlari, narxlar, davomiylik va o'qituvchilar tarkibi."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi kurs
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Jami kurs"
          value={stats.courses}
          icon={HiOutlineAcademicCap}
          tone="brand"
          loading={loading}
        />
        <QuickStat
          label="Faol guruh"
          value={stats.groups}
          icon={HiOutlineRectangleGroup}
          tone="sky"
          loading={loading}
        />
        <QuickStat
          label="O'quvchilar"
          value={stats.students}
          icon={HiOutlineUserGroup}
          tone="emerald"
          loading={loading}
        />
        <QuickStat
          label="O'rtacha narx"
          value={formatCurrency(stats.avgPrice, { compact: true })}
          icon={HiOutlineBanknotes}
          tone="violet"
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            placeholder="Kurs nomi yoki tavsifi bo'yicha qidirish..."
            className="lg:max-w-md lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center">
            <select
              className="input select"
              value={filters.color}
              onChange={(event) => setFilters((prev) => ({ ...prev, color: event.target.value }))}
              aria-label="Rang bo'yicha filtr"
            >
              <option value="">Barcha ranglar</option>
              {COURSE_COLORS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
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
          <p className="mt-3 text-[11px] text-subtle">{filtered.length} ta natija topildi</p>
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
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha kurslar yo'q"}
            description={
              activeFilters
                ? "Qidiruv yoki filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Birinchi kursni qo'shish uchun quyidagi tugmani bosing."
            }
            action={
              activeFilters ? (
                <Button
                  variant="secondary"
                  icon={HiOutlineFunnel}
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Filtrni tozalash
                </Button>
              ) : (
                <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
                  Kurs qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                groupsCount={courseCounts.get(String(course.id))?.groups || 0}
                studentsCount={courseCounts.get(String(course.id))?.students || 0}
                teachers={(course.teacherIds || [])
                  .map((id) => teacherMap.get(String(id)))
                  .filter(Boolean)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.courses}
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
        title={editing ? 'Kurs ma’lumotlarini tahrirlash' : "Yangi kurs qo'shish"}
        description={
          editing
            ? `“${editing.name}” kursi ma'lumotlarini yangilang.`
            : "Kurs nomi, narxi, davomiyligi va o'qituvchilarini belgilang."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="course-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <CourseForm
          key={editing?.id ?? 'new'}
          initialValues={editing}
          teachers={teachers}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
