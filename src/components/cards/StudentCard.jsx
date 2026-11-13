import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineEllipsisHorizontal,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineRectangleGroup,
  HiOutlineTrash,
  HiOutlineWallet,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Dropdown, { DropdownItem } from '@/components/common/Dropdown'
import { LevelBadge, PaymentStatusBadge } from '@/components/common/EntityBadges'
import { formatCurrency, formatDate, formatPhone } from '@/utils/format'
import { ROUTES } from '@/routes/paths'

function StudentCard({ student, course, group, onEdit, onDelete }) {
  const navigate = useNavigate()
  const fullName = `${student.firstName} ${student.lastName}`
  const open = () => navigate(ROUTES.student(student.id))

  function handleKey(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKey}
      aria-label={`${fullName} profili`}
      className="card group relative cursor-pointer overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 dark:hover:border-brand-400/30"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start gap-3">
        <Avatar
          firstName={student.firstName}
          lastName={student.lastName}
          src={student.photo}
          size="lg"
          ring
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[14.5px] font-bold tracking-[-0.02em] text-[var(--text)]">
            {fullName}
          </h3>
          <p className="mt-0.5 truncate text-[11.5px] text-muted">{formatPhone(student.phone)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <LevelBadge level={student.level} />
            <PaymentStatusBadge status={student.paymentStatus} short />
          </div>
        </div>
        <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <Dropdown
            trigger={
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                aria-label={`${fullName} uchun amallar`}
              >
                <HiOutlineEllipsisHorizontal className="size-5" />
              </button>
            }
            panelClassName="w-44"
          >
            {({ close }) => (
              <>
                <DropdownItem
                  icon={HiOutlineEye}
                  onClick={() => {
                    close()
                    open()
                  }}
                >
                  Batafsil
                </DropdownItem>
                <DropdownItem
                  icon={HiOutlinePencilSquare}
                  onClick={() => {
                    close()
                    onEdit(student)
                  }}
                >
                  Tahrirlash
                </DropdownItem>
                <DropdownItem
                  icon={HiOutlineTrash}
                  danger
                  onClick={() => {
                    close()
                    onDelete(student)
                  }}
                >
                  O'chirish
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
          <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
            <HiOutlineAcademicCap className="size-3" />
            Kurs
          </p>
          <p className="mt-1 truncate text-[11.5px] font-semibold text-[var(--text-2)]">
            {course?.name || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
          <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
            <HiOutlineRectangleGroup className="size-3" />
            Guruh
          </p>
          <p className="mt-1 truncate text-[11.5px] font-semibold text-[var(--text-2)]">
            {group?.name || '—'}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10.5px] text-subtle">
          <HiOutlineCalendarDays className="size-3.5" />
          {formatDate(student.enrollmentDate, { withYear: false })}
        </p>
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted">
          <HiOutlineWallet className="size-3.5" />
          {formatCurrency(student.monthlyFee, { compact: true })}
        </p>
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-[10px] font-medium text-subtle">ID #{student.id}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
          Batafsil
          <HiOutlineArrowRight className="size-3.5" />
        </span>
      </div>
    </article>
  )
}

export default memo(StudentCard)
