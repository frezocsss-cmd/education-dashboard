import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlineRectangleGroup,
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
import TeacherCard from '@/components/cards/TeacherCard'
import TeacherForm from '@/components/forms/TeacherForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { PAGE_SIZE, PERSON_STATUS } from '@/utils/constants'
import { detachTeacherRelation } from '@/utils/relations'
import { fullName } from '@/utils/stats'

const EMPTY_FILTERS = { search: '', specialization: '', status: '', sort: 'name-asc' }
const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Ism (A → Z)' },
  { value: 'name-desc', label: 'Ism (Z → A)' },
  { value: 'experience-desc', label: "Tajriba (ko'p → kam)" },
  { value: 'salary-desc', label: "Maosh (yuqori → past)" },
  { value: 'newest', label: "Yangi qo'shilgan" },
]

export default function Teachers() {
  const { data: teachers, loading, error, reload } = useCollection('teachers')
  const { data: groups, reload: reloadGroups } = useCollection('groups')
  const { data: courses, reload: reloadCourses } = useCollection('courses')
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const specializations = useMemo(
    () => [...new Set(teachers.map((teacher) => teacher.specialization).filter(Boolean))].sort(),
    [teachers],
  )

  const groupsCount = useMemo(() => {
    const map = new Map()
    groups.forEach((group) => {
      const key = String(group.teacherId)
      map.set(key, (map.get(key) || 0) + 1)
    })
    return map
  }, [groups])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    const list = teachers.filter((teacher) => {
      const matchesSearch =
        !search ||
        `${teacher.firstName} ${teacher.lastName} ${teacher.phone} ${teacher.email} ${teacher.specialization}`
          .toLowerCase()
          .includes(search)
      const matchesSpecialization =
        !filters.specialization || teacher.specialization === filters.specialization
      const matchesStatus = !filters.status || teacher.status === filters.status
      return matchesSearch && matchesSpecialization && matchesStatus
    })

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'name-desc':
          return fullName(b).localeCompare(fullName(a))
        case 'experience-desc':
          return Number(b.experience) - Number(a.experience)
        case 'salary-desc':
          return Number(b.salary) - Number(a.salary)
        case 'newest':
          return String(b.joinDate).localeCompare(String(a.joinDate))
        case 'name-asc':
        default:
          return fullName(a).localeCompare(fullName(b))
      }
    })
  }, [teachers, debouncedSearch, filters.specialization, filters.status, filters.sort])

  const stats = useMemo(
    () => ({
      total: teachers.length,
      active: teachers.filter((teacher) => teacher.status === 'active').length,
      groups: groups.length,
      payroll: teachers.reduce((total, teacher) => total + Number(teacher.salary || 0), 0),
    }),
    [teachers, groups],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.teachers))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.teachers
    return filtered.slice(start, start + PAGE_SIZE.teachers)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.specialization, filters.status, filters.sort])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const activeFilters =
    Boolean(debouncedSearch) || Boolean(filters.specialization) || Boolean(filters.status)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(teacher) {
    setEditing(teacher)
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
        await api.update('teachers', editing.id, { ...values, id: editing.id })
        toast.success("O'qituvchi yangilandi", `${values.firstName} ${values.lastName}`)
      } else {
        await api.create('teachers', { ...values, groupIds: [] })
        toast.success("Yangi o'qituvchi qo'shildi", `${values.firstName} ${values.lastName}`)
      }
      reload()
      closeModal()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(teacher) {
    const approved = await confirm({
      title: "O'qituvchini o'chirish",
      description: `“${teacher.firstName} ${teacher.lastName}” o'chiriladi. Biriktirilgan guruhlarda o'qituvchi bo'shatiladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await detachTeacherRelation({ teacher, groups })
      const courseTasks = courses
        .filter((course) => (course.teacherIds || []).map(String).includes(String(teacher.id)))
        .map((course) =>
          api.patch('courses', course.id, {
            teacherIds: course.teacherIds.filter((id) => String(id) !== String(teacher.id)),
          }),
        )
      await Promise.all(courseTasks)
      await api.remove('teachers', teacher.id)
      toast.success("O'qituvchi o'chirildi", `${teacher.firstName} ${teacher.lastName}`)
      reload()
      reloadGroups()
      reloadCourses()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="O'qituvchilar"
        description="O'qituvchilar jamoasi, ularning mutaxassisliklari, tajribasi va biriktirilgan guruhlari."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi o'qituvchi
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat label="Jami o'qituvchi" value={stats.total} icon={HiOutlineUsers} tone="brand" loading={loading} />
        <QuickStat label="Faol" value={stats.active} icon={HiOutlineAcademicCap} tone="emerald" loading={loading} />
        <QuickStat
          label="Guruhlar"
          value={stats.groups}
          icon={HiOutlineRectangleGroup}
          tone="violet"
          loading={loading}
        />
        <QuickStat
          label="Oylik fond"
          value={`${Math.round(stats.payroll / 1_000_000)} mln`}
          icon={HiOutlineBanknotes}
          tone="amber"
          hint="so'm"
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            placeholder="Ism, telefon, email yoki mutaxassislik bo'yicha qidirish..."
            className="lg:max-w-md lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center">
            <select
              className="input select"
              value={filters.specialization}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, specialization: event.target.value }))
              }
              aria-label="Mutaxassislik bo'yicha filtr"
            >
              <option value="">Barcha mutaxassisliklar</option>
              {specializations.map((item) => (
                <option key={item} value={item}>
                  {item}
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
              {Object.entries(PERSON_STATUS).map(([key, meta]) => (
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
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="btn btn-ghost col-span-2 !px-3 sm:col-span-1"
              >
                <HiOutlineFunnel className="size-4" />
                Tozalash
              </button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={reload} description={error} />
      ) : loading ? (
        <CardGridSkeleton count={6} height="h-[17.5rem]" />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HiOutlineUsers}
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha o'qituvchilar yo'q"}
            description={
              activeFilters
                ? "Filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Jamoaga birinchi o'qituvchini qo'shing."
            }
            action={
              activeFilters ? (
                <Button variant="secondary" icon={HiOutlineFunnel} onClick={() => setFilters(EMPTY_FILTERS)}>
                  Filtrni tozalash
                </Button>
              ) : (
                <Button variant="primary" icon={HiOutlineUserPlus} onClick={openCreate}>
                  O'qituvchi qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                groupsCount={groupsCount.get(String(teacher.id)) || 0}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.teachers}
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
        title={editing ? "O'qituvchi ma'lumotlarini tahrirlash" : "Yangi o'qituvchi qo'shish"}
        description={
          editing
            ? `${editing.firstName} ${editing.lastName} ma'lumotlarini yangilang.`
            : "O'qituvchi haqidagi ma'lumotlarni to'ldiring. Yulduzchali maydonlar majburiy."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="teacher-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <TeacherForm
          key={editing?.id ?? 'new'}
          initialValues={editing}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
