import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineEllipsisHorizontal,
  HiOutlineFunnel,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
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
import { TableSkeleton } from '@/components/common/Skeleton'
import Avatar from '@/components/common/Avatar'
import Dropdown, { DropdownItem } from '@/components/common/Dropdown'
import { PersonStatusBadge } from '@/components/common/EntityBadges'
import EmployeeForm from '@/components/forms/EmployeeForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { PAGE_SIZE, PERSON_STATUS } from '@/utils/constants'
import { formatCurrency, formatPhone } from '@/utils/format'
import { fullName } from '@/utils/stats'

const EMPTY_FILTERS = { search: '', position: '', status: '', sort: 'name-asc' }

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Ism (A → Z)' },
  { value: 'name-desc', label: 'Ism (Z → A)' },
  { value: 'salary-desc', label: "Maosh (yuqori → past)" },
  { value: 'newest', label: "Yangi qo'shilgan" },
]

export default function Employees() {
  const { data: employees, loading, error, reload } = useCollection('employees')
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const positions = useMemo(
    () => [...new Set(employees.map((employee) => employee.position).filter(Boolean))].sort(),
    [employees],
  )

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    const list = employees.filter((employee) => {
      const matchesSearch =
        !search ||
        `${employee.firstName} ${employee.lastName} ${employee.phone} ${employee.position}`
          .toLowerCase()
          .includes(search)
      const matchesPosition = !filters.position || employee.position === filters.position
      const matchesStatus = !filters.status || employee.status === filters.status
      return matchesSearch && matchesPosition && matchesStatus
    })

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'name-desc':
          return fullName(b).localeCompare(fullName(a))
        case 'salary-desc':
          return Number(b.salary) - Number(a.salary)
        case 'newest':
          return String(b.joinDate).localeCompare(String(a.joinDate))
        case 'name-asc':
        default:
          return fullName(a).localeCompare(fullName(b))
      }
    })
  }, [employees, debouncedSearch, filters.position, filters.status, filters.sort])

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((item) => item.status === 'active').length,
      vacation: employees.filter((item) => item.status === 'vacation').length,
      payroll: employees.reduce((total, item) => total + Number(item.salary || 0), 0),
    }),
    [employees],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.employees))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.employees
    return filtered.slice(start, start + PAGE_SIZE.employees)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.position, filters.status, filters.sort])

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

  const activeFilters = Boolean(debouncedSearch) || Boolean(filters.position) || Boolean(filters.status)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(employee) {
    setEditing(employee)
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
        await api.update('employees', editing.id, { ...values, id: editing.id })
        toast.success('Xodim yangilandi', `${values.firstName} ${values.lastName}`)
      } else {
        await api.create('employees', values)
        toast.success("Yangi xodim qo'shildi", `${values.firstName} ${values.lastName}`)
      }
      reload()
      closeModal()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(employee) {
    const approved = await confirm({
      title: "Xodimni o'chirish",
      description: `“${employee.firstName} ${employee.lastName}” butunlay o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await api.remove('employees', employee.id)
      toast.success("Xodim o'chirildi", `${employee.firstName} ${employee.lastName}`)
      reload()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Xodimlar"
        description="Markaz xodimlari, lavozimlari, ish jadvali va maosh fondi nazorati."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi xodim
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat label="Jami xodim" value={stats.total} icon={HiOutlineBriefcase} tone="brand" loading={loading} />
        <QuickStat label="Faol" value={stats.active} icon={HiOutlineUsers} tone="emerald" loading={loading} />
        <QuickStat label="Ta'tilda" value={stats.vacation} icon={HiOutlineCalendarDays} tone="amber" loading={loading} />
        <QuickStat
          label="Oylik fond"
          value={formatCurrency(stats.payroll, { compact: true })}
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
            placeholder="Ism, lavozim yoki telefon bo'yicha qidirish..."
            className="lg:max-w-md lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:ml-auto lg:flex lg:items-center">
            <select
              className="input select"
              value={filters.position}
              onChange={(event) => setFilters((prev) => ({ ...prev, position: event.target.value }))}
              aria-label="Lavozim bo'yicha filtr"
            >
              <option value="">Barcha lavozimlar</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
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
                className="btn btn-ghost !px-3"
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
        <TableSkeleton rows={6} columns={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HiOutlineBriefcase}
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha xodimlar yo'q"}
            description={
              activeFilters
                ? "Filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Markaz jamoasiga birinchi xodimni qo'shing."
            }
            action={
              activeFilters ? (
                <Button variant="secondary" icon={HiOutlineFunnel} onClick={() => setFilters(EMPTY_FILTERS)}>
                  Filtrni tozalash
                </Button>
              ) : (
                <Button variant="primary" icon={HiOutlineUserPlus} onClick={openCreate}>
                  Xodim qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-shell min-w-[920px]">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Lavozim</th>
                    <th>Aloqa</th>
                    <th>Ish jadvali</th>
                    <th>Maosh</th>
                    <th>Holat</th>
                    <th className="text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            firstName={employee.firstName}
                            lastName={employee.lastName}
                            src={employee.photo}
                            size="sm"
                            status={employee.status}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                              {fullName(employee)}
                            </p>
                            <p className="text-[10px] text-subtle">ID #{employee.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-[12px] font-medium text-[var(--text-2)]">
                          {employee.position}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <a
                          href={`tel:${employee.phone}`}
                          className="text-[12px] text-muted transition-colors hover:text-brand-600 dark:hover:text-brand-300"
                        >
                          {formatPhone(employee.phone)}
                        </a>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-[11.5px] whitespace-nowrap text-muted">
                          <HiOutlineClock className="size-3.5 text-[var(--text-3)]" />
                          {employee.schedule}
                        </span>
                      </td>
                      <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                        {formatCurrency(employee.salary, { compact: true })}
                      </td>
                      <td>
                        <PersonStatusBadge status={employee.status} />
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="icon-btn icon-btn-sm"
                                aria-label={`${fullName(employee)} uchun amallar`}
                              >
                                <HiOutlineEllipsisHorizontal className="size-5" />
                              </button>
                            }
                            panelClassName="w-44"
                          >
                            {({ close }) => (
                              <>
                                <DropdownItem
                                  icon={HiOutlinePencilSquare}
                                  onClick={() => {
                                    close()
                                    openEdit(employee)
                                  }}
                                >
                                  Tahrirlash
                                </DropdownItem>
                                <DropdownItem
                                  icon={HiOutlineTrash}
                                  danger
                                  onClick={() => {
                                    close()
                                    handleDelete(employee)
                                  }}
                                >
                                  O'chirish
                                </DropdownItem>
                              </>
                            )}
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.employees}
            total={filtered.length}
            onChange={setPage}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="lg"
        title={editing ? "Xodim ma'lumotlarini tahrirlash" : "Yangi xodim qo'shish"}
        description={
          editing
            ? `${editing.firstName} ${editing.lastName} ma'lumotlarini yangilang.`
            : "Xodim haqidagi barcha ma'lumotlarni to'ldiring."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="employee-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <EmployeeForm key={editing?.id ?? 'new'} initialValues={editing} onSubmit={handleSave} />
      </Modal>
    </div>
  )
}
