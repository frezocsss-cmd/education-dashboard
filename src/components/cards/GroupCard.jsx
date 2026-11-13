import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineEllipsisHorizontal,
  HiOutlineEye,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Dropdown, { DropdownItem } from '@/components/common/Dropdown'
import { GroupStatusBadge, LevelBadge } from '@/components/common/EntityBadges'
import { formatDate } from '@/utils/format'
import { fullName } from '@/utils/stats'
import { ROUTES } from '@/routes/paths'

const COLOR_BARS = {
  violet: 'from-violet-500 to-indigo-600',
  indigo: 'from-indigo-500 to-blue-600',
  emerald: 'from-emerald-500 to-teal-600',
  sky: 'from-sky-500 to-blue-600',
  rose: 'from-rose-500 to-pink-600',
  amber: 'from-amber-500 to-orange-600',
  teal: 'from-teal-500 to-cyan-600',
  orange: 'from-orange-500 to-amber-600',
}

function GroupCard({ group, course, teacher, studentCount, onEdit, onDelete }) {
  const navigate = useNavigate()
  const open = () => navigate(ROUTES.group(group.id))

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
      aria-label={`${group.name} guruhi`}
      className="card group relative cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 dark:hover:border-brand-400/30"
    >
      <div className={`h-1 bg-gradient-to-r ${COLOR_BARS[course?.color] || COLOR_BARS.violet}`} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <HiOutlineAcademicCap className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-extrabold tracking-[-0.025em] text-[var(--text)]">
              {group.name}
            </h3>
            <p className="mt-0.5 truncate text-[11.5px] text-muted">
              {course?.name || 'Kurs tanlanmagan'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <GroupStatusBadge status={group.status} />
              <LevelBadge level={group.level} />
            </div>
          </div>
          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <Dropdown
              trigger={
                <button type="button" className="icon-btn icon-btn-sm" aria-label={`${group.name} uchun amallar`}>
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
                      onEdit(group)
                    }}
                  >
                    Tahrirlash
                  </DropdownItem>
                  <DropdownItem
                    icon={HiOutlineTrash}
                    danger
                    onClick={() => {
                      close()
                      onDelete(group)
                    }}
                  >
                    O'chirish
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="flex items-center gap-2 text-[11.5px] text-muted">
            <HiOutlineCalendarDays className="size-3.5 shrink-0 text-[var(--text-3)]" />
            <span className="truncate">{group.days || 'Kunlar belgilanmagan'}</span>
          </p>
          <p className="flex items-center gap-2 text-[11.5px] text-muted">
            <HiOutlineClock className="size-3.5 shrink-0 text-[var(--text-3)]" />
            <span className="truncate">{group.time || 'Vaqt belgilanmagan'}</span>
          </p>
          <p className="flex items-center gap-2 text-[11.5px] text-muted">
            <HiOutlineMapPin className="size-3.5 shrink-0 text-[var(--text-3)]" />
            <span className="truncate">{group.room ? `${group.room}-xona` : 'Xona belgilanmagan'}</span>
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {teacher ? (
            <>
              <Avatar
                firstName={teacher.firstName}
                lastName={teacher.lastName}
                src={teacher.photo}
                size="xs"
              />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted">
                {fullName(teacher)}
              </span>
            </>
          ) : (
            <span className="flex-1 text-[11px] text-subtle">O'qituvchi tayinlanmagan</span>
          )}
          <span className="chip shrink-0">
            <HiOutlineUserGroup className="size-3" />
            {studentCount}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className="flex items-center gap-1.5 text-[10.5px] text-subtle">
            <HiOutlineCalendarDays className="size-3.5" />
            {formatDate(group.startDate, { withYear: false })} dan
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
            Batafsil
            <HiOutlineArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  )
}

export default memo(GroupCard)
