import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineEllipsisHorizontal,
  HiOutlineExclamationCircle,
  HiOutlineFunnel,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineReceiptPercent,
  HiOutlineTrash,
  HiOutlineWallet,
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
import { PaymentMethodBadge, PaymentStatusBadge } from '@/components/common/EntityBadges'
import PaymentForm from '@/components/forms/PaymentForm'
import { useCollection, useDebouncedValue } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { PAGE_SIZE, PAYMENT_METHODS, PAYMENT_STATUS } from '@/utils/constants'
import { formatCurrency, formatDate, monthKey, monthLabel } from '@/utils/format'
import {
  filterPaymentsByMonth,
  fullName,
  paymentPaidAmount,
  paymentTotals,
} from '@/utils/stats'
import { refreshStudentPaymentStatus } from '@/utils/relations'

const EMPTY_FILTERS = {
  search: '',
  month: '',
  status: '',
  method: '',
  sort: 'date-desc',
}

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Sana (yangi → eski)' },
  { value: 'date-asc', label: 'Sana (eski → yangi)' },
  { value: 'amount-desc', label: 'Summa (yuqori → past)' },
  { value: 'amount-asc', label: 'Summa (past → yuqori)' },
]

export default function Payments() {
  const { data: payments, loading, error, reload } = useCollection('payments')
  const { data: students, reload: reloadStudents } = useCollection('students')
  const { data: groups } = useCollection('groups')

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(filters.search, 250)

  const studentMap = useMemo(
    () => new Map(students.map((student) => [String(student.id), student])),
    [students],
  )

  const months = useMemo(
    () => [...new Set(payments.map((payment) => payment.month).filter(Boolean))].sort().reverse(),
    [payments],
  )

  const currentMonth = monthKey(new Date())

  const stats = useMemo(() => {
    const monthly = filterPaymentsByMonth(payments, currentMonth)
    const totals = paymentTotals(monthly)
    return { ...totals, month: currentMonth }
  }, [payments, currentMonth])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    const list = payments.filter((payment) => {
      const student = studentMap.get(String(payment.studentId))
      const matchesSearch =
        !search ||
        `${student ? fullName(student) : ''} ${student?.phone || ''} ${payment.note || ''}`
          .toLowerCase()
          .includes(search)
      const matchesMonth = !filters.month || payment.month === filters.month
      const matchesStatus = !filters.status || payment.status === filters.status
      const matchesMethod = !filters.method || payment.method === filters.method
      return matchesSearch && matchesMonth && matchesStatus && matchesMethod
    })

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'date-asc':
          return String(a.date || '').localeCompare(String(b.date || ''))
        case 'amount-desc':
          return Number(b.amount) - Number(a.amount)
        case 'amount-asc':
          return Number(a.amount) - Number(b.amount)
        case 'date-desc':
        default:
          return String(b.date || '').localeCompare(String(a.date || ''))
      }
    })
  }, [payments, studentMap, debouncedSearch, filters.month, filters.status, filters.method, filters.sort])

  const filteredTotals = useMemo(() => paymentTotals(filtered), [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE.payments))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE.payments
    return filtered.slice(start, start + PAGE_SIZE.payments)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.month, filters.status, filters.method, filters.sort])

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
    Boolean(debouncedSearch) ||
    Boolean(filters.month) ||
    Boolean(filters.status) ||
    Boolean(filters.method)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(payment) {
    setEditing(payment)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleSave(values) {
    const duplicate = payments.find(
      (payment) =>
        String(payment.id) !== String(editing?.id) &&
        String(payment.studentId) === String(values.studentId) &&
        payment.month === values.month,
    )
    if (duplicate) {
      toast.error(
        "To'lov allaqachon mavjud",
        `${monthLabel(values.month)} oyi uchun bu o'quvchida to'lov yozuvi bor.`,
      )
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await api.update('payments', editing.id, { ...editing, ...values, id: editing.id })
        await refreshStudentPaymentStatus(values.studentId)
        if (String(editing.studentId) !== String(values.studentId)) {
          await refreshStudentPaymentStatus(editing.studentId)
        }
        toast.success("To'lov yangilandi", monthLabel(values.month))
      } else {
        await api.create('payments', values)
        await refreshStudentPaymentStatus(values.studentId)
        toast.success("Yangi to'lov qo'shildi", monthLabel(values.month))
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

  async function handleDelete(payment) {
    const student = studentMap.get(String(payment.studentId))
    const approved = await confirm({
      title: "To'lovni o'chirish",
      description: `${student ? fullName(student) : 'O‘quvchi'} uchun ${monthLabel(
        payment.month,
      )} oyidagi to'lov yozuvi butunlay o'chiriladi.`,
      confirmLabel: "O'chirish",
    })
    if (!approved) return
    try {
      await api.remove('payments', payment.id)
      await refreshStudentPaymentStatus(payment.studentId)
      toast.success("To'lov o'chirildi", monthLabel(payment.month))
      reload()
      reloadStudents()
    } catch (err) {
      toast.error("O'chirishda xatolik", err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="To'lovlar"
        description="Oylik to'lovlar, qarzdorlik, to'lov usullari va moliyaviy nazorat."
        actions={
          <>
            <Button variant="secondary" icon={HiOutlineArrowPath} onClick={reload}>
              Yangilash
            </Button>
            <Button variant="primary" icon={HiOutlinePlus} onClick={openCreate}>
              Yangi to'lov
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Joriy oy hisoblandi"
          value={formatCurrency(stats.billed, { compact: true })}
          icon={HiOutlineReceiptPercent}
          tone="brand"
          hint={monthLabel(stats.month, { short: true })}
          loading={loading}
        />
        <QuickStat
          label="Joriy oy yig'ildi"
          value={formatCurrency(stats.paid, { compact: true })}
          icon={HiOutlineBanknotes}
          tone="emerald"
          loading={loading}
        />
        <QuickStat
          label="Joriy oy qarzi"
          value={formatCurrency(stats.debt, { compact: true })}
          icon={HiOutlineExclamationCircle}
          tone={stats.debt > 0 ? 'rose' : 'emerald'}
          loading={loading}
        />
        <QuickStat
          label="Joriy oy to'lovlari"
          value={stats.count}
          icon={HiOutlineWallet}
          tone="violet"
          hint={`${stats.unpaidCount + stats.partialCount} qarzdor`}
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="O'quvchi ismi, telefon yoki izoh bo'yicha qidirish..."
              className="lg:max-w-sm lg:flex-1"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:ml-auto lg:flex lg:items-center">
              <select
                className="input select"
                value={filters.month}
                onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}
                aria-label="Oy bo'yicha filtr"
              >
                <option value="">Barcha oylar</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
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
                {Object.entries(PAYMENT_STATUS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <select
                className="input select"
                value={filters.method}
                onChange={(event) => setFilters((prev) => ({ ...prev, method: event.target.value }))}
                aria-label="Usul bo'yicha filtr"
              >
                <option value="">Barcha usullar</option>
                {Object.entries(PAYMENT_METHODS).map(([key, meta]) => (
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
            </div>
          </div>
          {activeFilters && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-3">
              <p className="text-[11px] text-subtle">
                <span className="font-bold text-[var(--text)]">{filtered.length}</span> ta yozuv ·
                to'langan{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(filteredTotals.paid, { compact: true })}
                </span>{' '}
                · qarz{' '}
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(filteredTotals.debt, { compact: true })}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="btn btn-ghost ml-auto !px-3"
              >
                <HiOutlineFunnel className="size-4" />
                Tozalash
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={reload} description={error} />
      ) : loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HiOutlineBanknotes}
            title={activeFilters ? "Filtr bo'yicha natija topilmadi" : "Hozircha to'lovlar yo'q"}
            description={
              activeFilters
                ? "Qidiruv yoki filtr shartlarini o'zgartirib qayta urinib ko'ring."
                : "Birinchi to'lov yozuvini qo'shish uchun quyidagi tugmani bosing."
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
                  To'lov qo'shish
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-shell min-w-[1040px]">
                <thead>
                  <tr>
                    <th>O'quvchi</th>
                    <th>Oy</th>
                    <th>Summa</th>
                    <th>To'langan</th>
                    <th>Qarz</th>
                    <th>Holat</th>
                    <th>Usul</th>
                    <th>Sana</th>
                    <th className="text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((payment) => {
                    const student = studentMap.get(String(payment.studentId))
                    const paid = paymentPaidAmount(payment)
                    const debt = Math.max(Number(payment.amount) - paid, 0)
                    return (
                      <tr key={payment.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              firstName={student?.firstName || '?'}
                              lastName={student?.lastName || ''}
                              src={student?.photo}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                                {student ? fullName(student) : "O'quvchi o'chirilgan"}
                              </p>
                              <p className="text-[10px] text-subtle">
                                {student ? student.phone : `ID #${payment.studentId}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="font-semibold whitespace-nowrap text-[var(--text)]">
                          {monthLabel(payment.month)}
                        </td>
                        <td className="whitespace-nowrap text-muted">
                          {formatCurrency(payment.amount, { compact: true })}
                        </td>
                        <td className="font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(paid, { compact: true })}
                        </td>
                        <td
                          className={
                            debt > 0
                              ? 'font-semibold whitespace-nowrap text-rose-600 dark:text-rose-400'
                              : 'whitespace-nowrap text-subtle'
                          }
                        >
                          {debt > 0 ? formatCurrency(debt, { compact: true }) : '—'}
                        </td>
                        <td>
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td>
                          <PaymentMethodBadge method={payment.method} />
                        </td>
                        <td className="whitespace-nowrap text-muted">
                          {payment.date ? formatDate(payment.date) : '—'}
                        </td>
                        <td>
                          <div className="flex justify-end">
                            <Dropdown
                              trigger={
                                <button
                                  type="button"
                                  className="icon-btn icon-btn-sm"
                                  aria-label="To'lov amallari"
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
                                      openEdit(payment)
                                    }}
                                  >
                                    Tahrirlash
                                  </DropdownItem>
                                  <DropdownItem
                                    icon={HiOutlineTrash}
                                    danger
                                    onClick={() => {
                                      close()
                                      handleDelete(payment)
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE.payments}
            total={filtered.length}
            onChange={setPage}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="lg"
        title={editing ? "To'lovni tahrirlash" : "Yangi to'lov qo'shish"}
        description={
          editing
            ? `${studentMap.get(String(editing.studentId)) ? fullName(studentMap.get(String(editing.studentId))) : 'O‘quvchi'} · ${monthLabel(editing.month)}`
            : "O'quvchi, oy va to'lov summasi haqidagi ma'lumotlarni to'ldiring."
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" form="payment-form" variant="primary" loading={submitting}>
              {editing ? 'Saqlash' : "Qo'shish"}
            </Button>
          </>
        }
      >
        <PaymentForm
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
