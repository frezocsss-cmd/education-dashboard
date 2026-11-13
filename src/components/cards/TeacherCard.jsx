import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineEllipsisHorizontal,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineRectangleGroup,
  HiOutlineTrash,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Dropdown, { DropdownItem } from '@/components/common/Dropdown'
import { PersonStatusBadge } from '@/components/common/EntityBadges'
import { formatCurrency, formatPhone } from '@/utils/format'
import { ROUTES } from '@/routes/paths'

function TeacherCard({ teacher, groupsCount, onEdit, onDelete }) {
  const navigate = useNavigate()
  const fullName = `${teacher.firstName} ${teacher.lastName}`
  const open = () => navigate(ROUTES.teacher(teacher.id))

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      }}
      aria-label={`${fullName} profili`}
      className="card group relative cursor-pointer overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[var(--shadow-lift)] dark:hover:border-brand-400/30"
    >
      <div className="pointer-events-none absolute -top-20 -right-16 size-40 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start gap-3">
        <Avatar
          firstName={teacher.firstName}
          lastName={teacher.lastName}
          src={teacher.photo}
          size="lg"
          status={teacher.status}
          ring
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[14.5px] font-bold tracking-[-0.02em] text-[var(--text)]">
            {fullName}
          </h3>
          <p className="mt-0.5 truncate text-[11.5px] font-medium text-brand-600 dark:text-brand-300">
            {teacher.specialization}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PersonStatusBadge status={teacher.status} />
            <span className="chip">
              <HiOutlineRectangleGroup className="size-3" />
              {groupsCount} guruh
            </span>
          </div>
        </div>
        <div onClick={(event) => event.stopPropagation()}>
          <Dropdown
            trigger={
              <button type="button" className="icon-btn icon-btn-sm" aria-label="Amallar">
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
                    onEdit(teacher)
                  }}
                >
                  Tahrirlash
                </DropdownItem>
                <DropdownItem
                  icon={HiOutlineTrash}
                  danger
                  onClick={() => {
                    close()
                    onDelete(teacher)
                  }}
                >
                  O'chirish
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="relative mt-4 space-y-2">
        <p className="flex items-center gap-2 text-[11.5px] text-muted">
          <HiOutlinePhone className="size-3.5 shrink-0 text-[var(--text-3)]" />
          <span className="truncate">{formatPhone(teacher.phone)}</span>
        </p>
        <p className="flex items-center gap-2 text-[11.5px] text-muted">
          <HiOutlineEnvelope className="size-3.5 shrink-0 text-[var(--text-3)]" />
          <span className="truncate">{teacher.email}</span>
        </p>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
        <div>
          <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
            <HiOutlineAcademicCap className="size-3" />
            Tajriba
          </p>
          <p className="mt-0.5 text-[12px] font-bold text-[var(--text)]">{teacher.experience} yil</p>
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">Maosh</p>
          <p className="mt-0.5 text-[12px] font-bold text-[var(--text)]">
            {formatCurrency(teacher.salary, { compact: true })}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-end">
        <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
          Profilni ko'rish
          <HiOutlineArrowRight className="size-3.5" />
        </span>
      </div>
    </article>
  )
}

export default memo(TeacherCard)
