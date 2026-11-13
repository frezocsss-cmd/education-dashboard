import { useMemo, useState } from 'react'
import {
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineRectangleGroup,
  HiOutlineUserGroup,
  HiOutlineXCircle,
} from 'react-icons/hi2'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import QuickStat from '@/components/common/QuickStat'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import { SectionCard } from '@/components/common/SectionCard'
import Avatar from '@/components/common/Avatar'
import { TableSkeleton } from '@/components/common/Skeleton'
import { PaymentStatusBadge } from '@/components/common/EntityBadges'
import { useCollection } from '@/hooks/useApi'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { ATTENDANCE_STATUS } from '@/utils/constants'
import { attendanceByDate, attendanceStats, fullName } from '@/utils/stats'
import { formatDate, formatDateFull, todayISO } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_ACTIONS = [
  { value: 'present', label: 'Keldi', icon: HiOutlineCheckCircle },
  { value: 'late', label: 'Kechikdi', icon: HiOutlineClock },
  { value: 'absent', label: 'Kelmadi', icon: HiOutlineXCircle },
]

const STATUS_ACTIVE = {
  present:
    'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 dark:border-emerald-400 dark:bg-emerald-500',
  late: 'border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-500/25 dark:border-amber-400 dark:bg-amber-500',
  absent:
    'border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-500/25 dark:border-rose-400 dark:bg-rose-500',
}

export default function Attendance() {
  const { data: groups, loading: groupsLoading, error: groupsError, reload: reloadGroups } =
    useCollection('groups')
  const {
    data: students,
    loading: studentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useCollection('students')
  const {
    data: attendance,
    loading: attendanceLoading,
    error: attendanceError,
    reload: reloadAttendance,
  } = useCollection('attendance')
  const { data: courses } = useCollection('courses')

  const [groupId, setGroupId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [edits, setEdits] = useState({ key: '', values: {} })
  const [saving, setSaving] = useState(false)

  const selectedGroupId = useMemo(() => {
    if (groupId || !groups.length) return groupId
    const active = groups.find((item) => item.status === 'active') || groups[0]
    return String(active.id)
  }, [groupId, groups])

  const group = useMemo(
    () => groups.find((item) => String(item.id) === String(selectedGroupId)),
    [groups, selectedGroupId],
  )
  const course = useMemo(
    () => courses.find((item) => String(item.id) === String(group?.courseId)),
    [courses, group?.courseId],
  )

  const members = useMemo(() => {
    if (!group) return []
    const ids = new Set((group.studentIds || []).map(String))
    students.forEach((student) => {
      if (String(student.groupId) === String(group.id)) ids.add(String(student.id))
    })
    return students
      .filter((student) => ids.has(String(student.id)))
      .sort((a, b) => fullName(a).localeCompare(fullName(b)))
  }, [students, group])

  const groupRecords = useMemo(
    () => attendance.filter((record) => String(record.groupId) === String(selectedGroupId)),
    [attendance, selectedGroupId],
  )

  const existingByStudent = useMemo(() => {
    const map = new Map()
    groupRecords
      .filter((record) => record.date === date)
      .forEach((record) => map.set(String(record.studentId), record))
    return map
  }, [groupRecords, date])

  const baseDraft = useMemo(() => {
    const next = {}
    members.forEach((member) => {
      const existing = existingByStudent.get(String(member.id))
      next[String(member.id)] = existing?.status || 'present'
    })
    return next
  }, [members, existingByStudent])

  const draftKey = `${selectedGroupId}:${date}`
  const draft = useMemo(
    () => ({ ...baseDraft, ...(edits.key === draftKey ? edits.values : {}) }),
    [baseDraft, edits, draftKey],
  )

  const todayStats = useMemo(() => {
    const todays = attendance.filter((record) => record.date === todayISO())
    return { ...attendanceStats(todays), marked: todays.length }
  }, [attendance])

  const groupHistory = useMemo(() => attendanceByDate(groupRecords), [groupRecords])

  const draftStats = useMemo(() => {
    const values = Object.values(draft)
    return {
      present: values.filter((value) => value === 'present').length,
      late: values.filter((value) => value === 'late').length,
      absent: values.filter((value) => value === 'absent').length,
    }
  }, [draft])

  const dirtyCount = useMemo(
    () =>
      members.filter((member) => {
        const existing = existingByStudent.get(String(member.id))
        return !existing || existing.status !== draft[String(member.id)]
      }).length,
    [members, existingByStudent, draft],
  )

  const loading = groupsLoading || studentsLoading || attendanceLoading
  const error = groupsError || studentsError || attendanceError

  function updateDraft(updater) {
    setEdits((prev) => {
      const current = prev.key === draftKey ? prev.values : baseDraft
      return { key: draftKey, values: updater(current) }
    })
  }

  function setStatus(studentId, status) {
    updateDraft((current) => ({ ...current, [String(studentId)]: status }))
  }

  function markAll(status) {
    updateDraft(() =>
      Object.fromEntries(members.map((member) => [String(member.id), status])),
    )
  }

  function retry() {
    reloadGroups()
    reloadStudents()
    reloadAttendance()
  }

  async function handleSave() {
    if (!group || !members.length) return
    setSaving(true)
    try {
      const tasks = members.map((member) => {
        const existing = existingByStudent.get(String(member.id))
        const status = draft[String(member.id)] || 'present'
        if (existing) {
          if (existing.status === status) return Promise.resolve()
          return api.patch('attendance', existing.id, { status })
        }
        return api.create('attendance', {
          studentId: member.id,
          groupId: group.id,
          date,
          status,
        })
      })
      await Promise.all(tasks)
      toast.success(
        'Davomat saqlandi',
        `${group.name} · ${formatDate(date)} · ${members.length} ta o'quvchi`,
      )
      reloadAttendance()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Davomat"
        description="Guruh va sana bo'yicha davomat belgilang, o'zgarishlarni saqlang va tarixni kuzating."
        actions={
          <Button variant="secondary" icon={HiOutlineArrowPath} onClick={retry}>
            Yangilash
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Bugun belgilangan"
          value={todayStats.marked}
          icon={HiOutlineCalendarDays}
          tone="brand"
          loading={loading}
        />
        <QuickStat
          label="Bugun keldi"
          value={todayStats.present}
          icon={HiOutlineCheckCircle}
          tone="emerald"
          loading={loading}
        />
        <QuickStat
          label="Bugun kechikdi"
          value={todayStats.late}
          icon={HiOutlineClock}
          tone="amber"
          loading={loading}
        />
        <QuickStat
          label="Bugun kelmadi"
          value={todayStats.absent}
          icon={HiOutlineExclamationCircle}
          tone="rose"
          loading={loading}
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="attendanceGroup">
              Guruh
            </label>
            <select
              id="attendanceGroup"
              className="input select"
              value={selectedGroupId}
              onChange={(event) => setGroupId(event.target.value)}
              disabled={!groups.length}
            >
              {groups.length === 0 && <option value="">Guruhlar mavjud emas</option>}
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.days} · {item.time}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-56">
            <label className="label" htmlFor="attendanceDate">
              Sana
            </label>
            <input
              id="attendanceDate"
              type="date"
              className="input"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={HiOutlineCheck}
              onClick={() => markAll('present')}
              disabled={!members.length}
            >
              Hammasi keldi
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={!members.length || dirtyCount === 0}
            >
              Saqlash{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
            </Button>
          </div>
        </div>

        {group && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--border)] pt-3 text-[11px] text-subtle">
            <span className="flex items-center gap-1.5">
              <HiOutlineRectangleGroup className="size-3.5" />
              {group.name}
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineUserGroup className="size-3.5" />
              {members.length} o'quvchi
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlineCalendarDays className="size-3.5" />
              {formatDateFull(date)}
            </span>
            {course && <span className="truncate">{course.name}</span>}
            {dirtyCount > 0 && (
              <span className="ml-auto font-semibold text-amber-600 dark:text-amber-400">
                {dirtyCount} ta o'zgarish saqlanmagan
              </span>
            )}
          </div>
        )}
      </div>

      {error ? (
        <ErrorState onRetry={retry} description={error} />
      ) : loading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : !group ? (
        <div className="card">
          <EmptyState
            icon={HiOutlineRectangleGroup}
            title="Guruhlar mavjud emas"
            description="Davomat belgilash uchun avval guruh yarating."
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard
            title={`${group.name} · ${formatDate(date, { withYear: false })}`}
            description={`${members.length} ta o'quvchi · ${draftStats.present} keldi, ${draftStats.late} kechikdi, ${draftStats.absent} kelmadi`}
            className="xl:col-span-2"
            noPadding
            action={
              <span className="chip">
                {existingByStudent.size > 0 ? 'Belgilangan' : 'Yangi davomat'}
              </span>
            }
          >
            {members.length === 0 ? (
              <EmptyState
                compact
                icon={HiOutlineUserGroup}
                title="Guruhda o'quvchilar yo'q"
                description="Avval guruhga o'quvchi biriktiring, so'ng davomatni belgilang."
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {members.map((member) => {
                  const current = draft[String(member.id)]
                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-2.5 px-5 py-3 transition-colors hover:bg-[var(--surface-2)] sm:flex-row sm:items-center sm:px-6"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <Avatar
                          firstName={member.firstName}
                          lastName={member.lastName}
                          src={member.photo}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-bold text-[var(--text)]">
                            {fullName(member)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <p className="truncate text-[10px] text-subtle">{member.phone}</p>
                            <PaymentStatusBadge status={member.paymentStatus} short />
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1"
                        role="group"
                        aria-label={`${fullName(member)} davomati`}
                      >
                        {STATUS_ACTIONS.map((action) => {
                          const Icon = action.icon
                          const active = current === action.value
                          return (
                            <button
                              key={action.value}
                              type="button"
                              onClick={() => setStatus(member.id, action.value)}
                              aria-pressed={active}
                              className={cn(
                                'flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-[10.5px] font-bold transition-all sm:px-3',
                                active
                                  ? STATUS_ACTIVE[action.value]
                                  : 'text-muted hover:bg-[var(--surface-3)] hover:text-[var(--text)]',
                              )}
                            >
                              <Icon className="size-3.5" />
                              <span className="hidden sm:inline">{action.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <div className="space-y-4">
            <SectionCard
              title="Tanlangan kun xulosasi"
              description="Saqlashdan oldingi ko'rinish"
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <HiOutlineUserGroup className="size-4" />
                </span>
              }
            >
              <div className="space-y-2.5">
                {STATUS_ACTIONS.map((action) => {
                  const Icon = action.icon
                  const count = draftStats[action.value]
                  const rate = members.length ? Math.round((count / members.length) * 100) : 0
                  return (
                    <div key={action.value}>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="flex items-center gap-1.5 font-semibold text-muted">
                          <Icon
                            className={cn(
                              'size-3.5',
                              action.value === 'present'
                                ? 'text-emerald-500'
                                : action.value === 'late'
                                  ? 'text-amber-500'
                                  : 'text-rose-500',
                            )}
                          />
                          {ATTENDANCE_STATUS[action.value].label}
                        </span>
                        <span className="font-bold text-[var(--text)]">
                          {count} · {rate}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            action.value === 'present'
                              ? 'bg-emerald-500'
                              : action.value === 'late'
                                ? 'bg-amber-500'
                                : 'bg-rose-500',
                          )}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="So'nggi darslar"
              description="Tanlangan guruh tarixi"
              noPadding
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                  <HiOutlineCalendarDays className="size-4" />
                </span>
              }
            >
              {groupHistory.length === 0 ? (
                <p className="px-5 py-6 text-center text-xs text-subtle sm:px-6">
                  Bu guruh uchun davomat tarixi hali yo'q.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {groupHistory.slice(0, 7).map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setDate(day.date)}
                      className={cn(
                        'flex w-full items-center gap-2 px-5 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)] sm:px-6',
                        day.date === date && 'bg-brand-50/60 dark:bg-brand-500/5',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-semibold text-[var(--text)]">
                          {formatDate(day.date, { withYear: false })}
                        </span>
                        <span className="block text-[10px] text-subtle">
                          {day.present} keldi · {day.absent} kelmadi
                        </span>
                      </span>
                      <span
                        className={cn(
                          'text-[11px] font-extrabold',
                          day.rate >= 85
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : day.rate >= 70
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {day.rate}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  )
}
