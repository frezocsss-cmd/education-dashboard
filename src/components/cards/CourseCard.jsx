import { memo } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineRectangleGroup,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineWallet,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import { formatCurrency } from '@/utils/format'
import { fullName } from '@/utils/stats'

const COLOR_STYLES = {
  violet: {
    banner: 'from-violet-500 via-violet-600 to-indigo-600',
    soft: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  },
  indigo: {
    banner: 'from-indigo-500 via-indigo-600 to-blue-600',
    soft: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
  },
  emerald: {
    banner: 'from-emerald-500 via-emerald-600 to-teal-600',
    soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  sky: {
    banner: 'from-sky-500 via-sky-600 to-blue-600',
    soft: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
  },
  rose: {
    banner: 'from-rose-500 via-rose-600 to-pink-600',
    soft: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
  },
  amber: {
    banner: 'from-amber-500 via-amber-600 to-orange-600',
    soft: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  },
  teal: {
    banner: 'from-teal-500 via-teal-600 to-cyan-600',
    soft: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300',
  },
  orange: {
    banner: 'from-orange-500 via-orange-600 to-amber-600',
    soft: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300',
  },
}

function CourseCard({ course, groupsCount, studentsCount, teachers = [], onEdit, onDelete }) {
  const colors = COLOR_STYLES[course.color] || COLOR_STYLES.violet

  return (
    <article className="card group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[var(--shadow-lift)] dark:hover:border-brand-400/30">
      <div className={`relative h-24 bg-gradient-to-br ${colors.banner} p-4`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_85%_90%,rgba(255,255,255,0.12),transparent_45%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur">
            <HiOutlineAcademicCap className="size-5" />
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(course)}
              aria-label={`${course.name} kursini tahrirlash`}
              className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/90 backdrop-blur transition-colors hover:bg-white/25"
            >
              <HiOutlinePencilSquare className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(course)}
              aria-label={`${course.name} kursini o'chirish`}
              className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/90 backdrop-blur transition-colors hover:bg-rose-500/80"
            >
              <HiOutlineTrash className="size-4" />
            </button>
          </div>
        </div>
        <h3 className="relative mt-2 truncate text-[15px] font-extrabold tracking-[-0.025em] text-white">
          {course.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 min-h-[34px] text-[11.5px] leading-relaxed text-muted">
          {course.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
              <HiOutlineRectangleGroup className="size-3" />
              Guruhlar
            </p>
            <p className="mt-1 text-[13px] font-extrabold text-[var(--text)]">{groupsCount}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
              <HiOutlineUserGroup className="size-3" />
              O'quvchilar
            </p>
            <p className="mt-1 text-[13px] font-extrabold text-[var(--text)]">{studentsCount}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
              <HiOutlineCalendarDays className="size-3" />
              Davomiylik
            </p>
            <p className="mt-1 text-[12px] font-bold text-[var(--text)]">{course.duration} oy</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">
              <HiOutlineWallet className="size-3" />
              Narx
            </p>
            <p className="mt-1 text-[12px] font-bold text-[var(--text)]">
              {formatCurrency(course.price, { compact: true })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">
          <div className="flex -space-x-1.5">
            {teachers.slice(0, 3).map((teacher) => (
              <Avatar
                key={teacher.id}
                firstName={teacher.firstName}
                lastName={teacher.lastName}
                size="xs"
                className="ring-2 ring-[var(--surface)]"
              />
            ))}
            {teachers.length === 0 && <span className="text-[11px] text-subtle">O'qituvchi yo'q</span>}
          </div>
          {teachers.length > 0 && (
            <span className="min-w-0 flex-1 truncate text-[10.5px] text-subtle">
              {teachers.map(fullName).join(', ')}
            </span>
          )}
          <Link
            to={`/groups?course=${course.id}`}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold whitespace-nowrap text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-300"
          >
            Guruhlar
            <HiOutlineArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default memo(CourseCard)
