import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlinePhone,
  HiOutlinePlus,
  HiOutlineUserGroup,
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
import ParentCard from '@/components/cards/ParentCard'
import ParentForm from '@/components/forms/ParentForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { PAGE_SIZE } from '@/utils/constants'
import { fullName } from '@/utils/stats'
import {
  detachParentRelations,
  syncParentContact,
  syncParentStudents,
} from '@/utils/relations'

const EMPTY_FILTERS = { search: '', relation: '', sort: 'name-asc' }

const RELATION_OPTIONS = [
  { value: '', label: 'Barcha ota-onalar' },
  { value: 'linked', label: "Farzandi bog'langan" },
  { value: 'unlinked', label: "Farzandi yo'q" },
  { value: 'multi', label: '2+ farzandli' },
]

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Ism (A → Z)' },
  { value: 'name-desc', label: 'Ism (Z → A)' },
  { value: 'children-desc', label: "Farzandlar (ko'p → kam)" },
  { value: 'children-asc', label: "Farzandlar (kam → ko'p)" },
]

export default function Parents() {
  const { data: parents, loading, error, reload } = useCollection('parents')
  const { data: students, reload: reloadStudents } = useCollection('students')
  const { data: groups } = useCollection('groups')

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const childrenMap = useMemo(() => {
    const map = new Map()
    parents.forEach((parent) => {
      const fromStudents = students.filter(
        (student) => String(student.parentId) === String(parent.id),
      )
      const ids = new Set(fromStudents.map((student) => String(student.id)))
      ;(parent.studentIds || []).forEach((id) => {
        const student = students.find((item) => String(item.id) === String(id))
        if (student && !ids.has(String(student.id))) {
          fromStudents.push(student)
          ids.add(String(student.id))
        }
      })
      map.set(String(parent.id), fromStudents)
    })
    return map
  }, [parents, students])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    const list = parents.filter((parent) => {
      const children = childrenMap.get(String(parent.id)) || []
      const matchesSearch =
        !search ||
        `${parent.firstName} ${parent.lastName} ${parent.phone} ${parent.email || ''} ${
          parent.address || ''
        }`
          .toLowerCase()
          .includes(search)
      const matchesRelation =
        !filters.relation ||
        (filters.relation === 'linked' && children.length > 0) ||
        (filters.relation === 'unlinked' && children.length === 0) ||
        (filters.relation === 'multi' && children.length >= 2)
      return matchesSearch && matchesRelation
    })

    return [...list].sort((a, b) => {
      const aChildren = (childrenMap.get(String(a.id)) || []).length
      const bChildren = (childrenMap.get(String(b.id)) || []).length
      switch (filters.sort) {
        case 'name-desc':
          return fullName(b).localeCompare(fullName(a))
        case 'children-desc':
          return bChildren - aChildren || fullName(a).localeCompare(fullName(b))
        case 'children-asc':
          return aChildren - bChildren || fullName(a).localeCompare(fullName(b))
        case 'name-asc':
        default:
          return fullName(a).localeCompare(fullName(b))
      }
    })
  }, [parents, childrenMap, debouncedSearch, filters.relation, filters.sort])

  const stats = useMemo(() => {
    const counts = parents.map((parent) => (childrenMap.get(String(parent.id)) || []).length)
    return {
      total: parents.length,
      children: students.filter((student) => student.parentId).length,
      multi: counts.filter((count) => count >= 2).length,
      unlinked: counts.filter((count) => count === 0).length,
    }
  }, [parents, students, childrenMap])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.parents))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.parents
    return filtered.slice(start, start + PAGE_SIZE.parents)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.relation, filters.sort])

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

  const activeFilters = Boolean(debouncedSearch) || Boolean(filters.relation)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(parent) {
    setEditing(parent)
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
        const payload = { ...editing, ...values, id: editing.id }
        await api.update('parents', editing.id, payload)
        await syncParentStudents({
          parent: payload,
          nextStudentIds: values.studentIds,
        })
        await syncParentContact({ parent: payload, students })
        toast.success("Ota-ona ma'lumotlari yangilandi", fullName(values))
      } else {
        const created = await api.create('parents', { ...values, studentIds: [] })
        await syncParentStudents({ parent: created, nextStudentIds: values.studentIds })
        toast.success("Yangi ota-ona qo'shildi", fullName(values))
      }
      reload()
      reloadStudents()
      closeModal()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(parent) {
    const approved = await confirm({
      title: "Ota-onani o'chirish",
      description: `“${fullName(parent)}” o'chiriladi. Bog'langan farzandlar o'chirilmaydi, faqat ota-ona havolasi uziladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await detachParentRelations({ parent, students })
      await api.remove('parents', parent.id)
      toast.success("Ota-ona o'chirildi", fullName(parent))
      reload()
      reloadStudents()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ota-onalar"
        description="Ota-onalar bazasi, farzandlari bilan bog'lanishlar va aloqa ma'lumotlari."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi ota-ona
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Jami ota-ona"
          value={stats.total}
          icon={HiOutlineUsers}
          tone="brand"
          loading={loading}
        />
        <QuickStat
          label="Bog'langan o'quvchi"
          value={stats.children}
          icon={HiOutlineUserGroup}
          tone="emerald"
          loading={loading}
        />
        <QuickStat
          label="2+ farzandli"
          value={stats.multi}
          icon={HiOutlineUserGroup}
          tone="violet"
          loading={loading}
        />
        <QuickStat
          label="Farzandsiz"
          value={stats.unlinked}
          icon={HiOutlinePhone}
          tone="amber"
          hint="bog'lanish kerak"
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            placeholder="Ism, telefon, email yoki manzil bo'yicha qidirish..."
            className="lg:max-w-md lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center">
            <select
              className="input select"
              value={filters.relation}
              onChange={(event) => setFilters((prev) => ({ ...prev, relation: event.target.value }))}
              aria-label="Bog'lanish bo'yicha filtr"
            >
              {RELATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            icon={HiOutlineUserGroup}
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha ota-onalar yo'q"}
            description={
              activeFilters
                ? "Qidiruv yoki filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Birinchi ota-onani qo'shish uchun quyidagi tugmani bosing."
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
                <Button variant="primary" icon={HiOutlineUserPlus} onClick={openCreate}>
                  Ota-ona qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((parent) => (
              <ParentCard
                key={parent.id}
                parent={parent}
                linkedChildren={childrenMap.get(String(parent.id)) || []}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.parents}
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
        title={editing ? "Ota-ona ma'lumotlarini tahrirlash" : "Yangi ota-ona qo'shish"}
        description={
          editing
            ? `${fullName(editing)} ma'lumotlarini yangilang.`
            : "Ota-ona va unga bog'langan farzandlar haqidagi ma'lumotlarni to'ldiring."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="parent-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <ParentForm
          key={editing?.id ?? 'new'}
          initialValues={editing}
          students={students}
          groups={groups}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  )
}
