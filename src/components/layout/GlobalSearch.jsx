import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineAcademicCap,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineRectangleGroup,
  HiOutlineUsers,
} from 'react-icons/hi2'
import Modal from '@/components/common/Modal'
import { Skeleton } from '@/components/common/Skeleton'
import { useCollections } from '@/hooks/useApi'
import { navigation } from '@/config/navigation'
import { ROUTES } from '@/routes/paths'
import { cn } from '@/utils/cn'

export const SEARCH_RESOURCES = {
  students: 'students',
  teachers: 'teachers',
  groups: 'groups',
  courses: 'courses',
  parents: 'parents',
}

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('')
  const { data, loading } = useCollections(SEARCH_RESOURCES)
  const navigate = useNavigate()

  const quickLinks = useMemo(
    () => navigation.flatMap((section) => section.items).slice(0, 8),
    [],
  )

  const results = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return []
    const groups = []

    const students = (data.students || []).filter((student) =>
      `${student.firstName} ${student.lastName} ${student.phone} ${student.parentName}`
        .toLowerCase()
        .includes(search),
    )
    if (students.length) {
      groups.push({
        key: 'students',
        label: "O'quvchilar",
        icon: HiOutlineAcademicCap,
        items: students.slice(0, 5).map((student) => ({
          id: student.id,
          title: `${student.firstName} ${student.lastName}`,
          subtitle: `${student.parentPhone || student.phone} · ID #${student.id}`,
          to: ROUTES.student(student.id),
        })),
        total: students.length,
      })
    }

    const teachers = (data.teachers || []).filter((teacher) =>
      `${teacher.firstName} ${teacher.lastName} ${teacher.specialization} ${teacher.phone}`
        .toLowerCase()
        .includes(search),
    )
    if (teachers.length) {
      groups.push({
        key: 'teachers',
        label: "O'qituvchilar",
        icon: HiOutlineUsers,
        items: teachers.slice(0, 4).map((teacher) => ({
          id: teacher.id,
          title: `${teacher.firstName} ${teacher.lastName}`,
          subtitle: teacher.specialization,
          to: ROUTES.teacher(teacher.id),
        })),
        total: teachers.length,
      })
    }

    const groupsResult = (data.groups || []).filter((group) =>
      `${group.name} ${group.room}`.toLowerCase().includes(search),
    )
    if (groupsResult.length) {
      groups.push({
        key: 'groups',
        label: 'Guruhlar',
        icon: HiOutlineRectangleGroup,
        items: groupsResult.slice(0, 4).map((group) => ({
          id: group.id,
          title: group.name,
          subtitle: `${group.days} · ${group.time}`,
          to: ROUTES.group(group.id),
        })),
        total: groupsResult.length,
      })
    }

    const courses = (data.courses || []).filter((course) =>
      `${course.name} ${course.description}`.toLowerCase().includes(search),
    )
    if (courses.length) {
      groups.push({
        key: 'courses',
        label: 'Kurslar',
        icon: HiOutlineCalendarDays,
        items: courses.slice(0, 3).map((course) => ({
          id: course.id,
          title: course.name,
          subtitle: `${course.duration} oy · ${course.levels} daraja`,
          to: ROUTES.courses,
        })),
        total: courses.length,
      })
    }

    const parents = (data.parents || []).filter((parent) =>
      `${parent.firstName} ${parent.lastName} ${parent.phone}`.toLowerCase().includes(search),
    )
    if (parents.length) {
      groups.push({
        key: 'parents',
        label: 'Ota-onalar',
        icon: HiOutlineChatBubbleLeftRight,
        items: parents.slice(0, 3).map((parent) => ({
          id: parent.id,
          title: `${parent.firstName} ${parent.lastName}`,
          subtitle: parent.phone,
          to: ROUTES.parent(parent.id),
        })),
        total: parents.length,
      })
    }

    return groups
  }, [query, data])

  const total = results.reduce((sum, group) => sum + group.total, 0)
  const search = query.trim()

  function go(to) {
    navigate(to)
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="lg" className="sm:max-w-2xl">
      <div className="-mx-1">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="O'quvchi, o'qituvchi, guruh yoki kursni qidiring..."
            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] py-3.5 pr-20 pl-12 text-sm font-medium text-[var(--text)] outline-none transition placeholder:text-[var(--text-3)] focus:border-brand-500 focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--ring)]"
            aria-label="Global qidiruv"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold text-subtle">
            ESC
          </kbd>
        </div>

        <div className="mt-4 max-h-[58vh] min-h-[220px] overflow-y-auto pr-1">
          {!search ? (
            <div>
              <p className="mb-2 px-1 text-[10px] font-bold tracking-[0.14em] text-subtle uppercase">
                Tezkor o'tish
              </p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <button
                      key={link.to}
                      type="button"
                      onClick={() => go(link.to)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-3)]"
                    >
                      <Icon className="size-4 text-brand-500" />
                      <span className="text-[13px] font-medium text-[var(--text-2)]">
                        {link.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
                <HiOutlineClipboardDocumentCheck className="size-4 text-emerald-500" />
                <p className="text-[11px] text-muted">
                  Qidiruv o'quvchilar, o'qituvchilar, guruhlar, kurslar va ota-onalar bo'ylab
                  ishlaydi.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl p-2.5">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-3)]">
                <HiOutlineMagnifyingGlass className="size-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-[var(--text)]">Hech narsa topilmadi</p>
              <p className="mt-1 text-xs text-muted">
                “{search}” bo'yicha natija yo'q. Boshqacha so'z bilan urinib ko'ring.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-1">
              <p className="px-1 text-[10.5px] font-semibold text-subtle">
                {total} ta natija topildi
              </p>
              {results.map((group) => {
                const Icon = group.icon
                return (
                  <div key={group.key}>
                    <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-[0.12em] text-subtle uppercase">
                      <Icon className="size-3.5" />
                      {group.label}
                      <span className="text-[var(--text-3)]">· {group.total}</span>
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <button
                          key={`${group.key}-${item.id}`}
                          type="button"
                          onClick={() => go(item.to)}
                          className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-3)]"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-3)] group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-300">
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[var(--text)]">
                              {item.title}
                            </span>
                            <span className="block truncate text-[11px] text-subtle">
                              {item.subtitle}
                            </span>
                          </span>
                          <span className="text-[10px] font-medium text-[var(--text-3)] opacity-0 transition-opacity group-hover:opacity-100">
                            O'tish →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <div className="flex items-center gap-3 text-[10px] text-subtle">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1 py-0.5 font-sans">
                ESC
              </kbd>
              yopish
            </span>
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold',
              loading ? 'text-subtle' : 'text-emerald-600 dark:text-emerald-400',
            )}
          >
            {loading ? 'Yuklanmoqda...' : 'Tayyor'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
