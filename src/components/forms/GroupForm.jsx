import { useMemo } from 'react'
import { Field, FormGrid, FormSection, Input, Select, Textarea } from '@/components/common/FormControls'
import { GROUP_STATUS, LEVELS, WEEKDAYS } from '@/utils/constants'
import { isDate, required, validateFields } from '@/utils/validation'
import { todayISO } from '@/utils/format'
import { fullName } from '@/utils/stats'
import { useForm } from '@/hooks/useApi'

const DEFAULT_VALUES = {
  name: '',
  courseId: '',
  teacherId: '',
  studentIds: [],
  days: '',
  time: '',
  room: '',
  startDate: todayISO(),
  status: 'active',
  level: "Boshlang'ich",
}

function toFormValues(group) {
  if (!group) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...group,
    courseId: group.courseId ? String(group.courseId) : '',
    teacherId: group.teacherId ? String(group.teacherId) : '',
    days: group.days || '',
    studentIds: group.studentIds || [],
  }
}

function dayList(days) {
  return String(days || '')
    .split(',')
    .map((day) => day.trim())
    .filter(Boolean)
}

export default function GroupForm({
  formId = 'group-form',
  initialValues,
  courses = [],
  teachers = [],
  onSubmit,
}) {
  const { values, errors, setField, setErrors } = useForm(toFormValues(initialValues))

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.name.localeCompare(b.name)),
    [courses],
  )

  const teacherOptions = useMemo(() => {
    const course = courses.find((item) => String(item.id) === String(values.courseId))
    const preferred = new Set((course?.teacherIds || []).map(String))
    return [...teachers].sort((a, b) => {
      const aPreferred = preferred.has(String(a.id)) ? 0 : 1
      const bPreferred = preferred.has(String(b.id)) ? 0 : 1
      return aPreferred - bPreferred || fullName(a).localeCompare(fullName(b))
    })
  }, [teachers, courses, values.courseId])

  const selectedDays = dayList(values.days)

  function toggleDay(key) {
    const next = selectedDays.includes(key)
      ? selectedDays.filter((day) => day !== key)
      : [...selectedDays, key]
    const ordered = WEEKDAYS.filter((day) => next.includes(day.key)).map((day) => day.key)
    setField('days', ordered.join(', '))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      name: [(value) => required(value, 'Guruh nomini kiriting')],
      courseId: [(value) => required(value, 'Kursni tanlang')],
      teacherId: [(value) => required(value, "O'qituvchini tanlang")],
      level: [(value) => required(value, 'Darajani tanlang')],
      days: [(value) => required(value, "Kamida bitta kunni tanlang")],
      time: [(value) => required(value, 'Dars vaqtini kiriting')],
      room: [(value) => required(value, 'Xona raqamini kiriting')],
      startDate: [isDate],
    })

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      ...values,
      name: values.name.trim().toUpperCase(),
      courseId: Number(values.courseId),
      teacherId: Number(values.teacherId),
      room: values.room.trim(),
      time: values.time.trim(),
      days: selectedDays.join(', '),
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection title="Guruh ma'lumotlari" description="Nomi, yo'nalishi va darajasi.">
        <FormGrid>
          <Field
            label="Guruh nomi"
            htmlFor="groupName"
            error={errors.name}
            hint="Masalan: ENG-A1-03"
            required
          >
            <Input
              id="groupName"
              autoFocus
              placeholder="ENG-A1-03"
              value={values.name}
              onChange={(event) => setField('name', event.target.value.toUpperCase())}
              error={Boolean(errors.name)}
              className="uppercase"
            />
          </Field>
          <Field label="Kurs" htmlFor="groupCourse" error={errors.courseId} required>
            <Select
              id="groupCourse"
              value={values.courseId}
              onChange={(event) => setField('courseId', event.target.value)}
              error={Boolean(errors.courseId)}
            >
              <option value="">Kursni tanlang</option>
              {sortedCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="O'qituvchi" htmlFor="groupTeacher" error={errors.teacherId} required>
            <Select
              id="groupTeacher"
              value={values.teacherId}
              onChange={(event) => setField('teacherId', event.target.value)}
              error={Boolean(errors.teacherId)}
            >
              <option value="">O'qituvchini tanlang</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {fullName(teacher)} — {teacher.specialization}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Daraja" htmlFor="groupLevel" error={errors.level} required>
            <Select
              id="groupLevel"
              value={values.level}
              onChange={(event) => setField('level', event.target.value)}
              error={Boolean(errors.level)}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Dars jadvali" description="Haftalik kunlar, vaqt va xona.">
        <Field label="Dars kunlari" error={errors.days} required>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day.key)
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  aria-pressed={active}
                  title={day.label}
                  className={
                    active
                      ? 'flex h-9 min-w-11 items-center justify-center rounded-lg bg-brand-600 px-2.5 text-[11.5px] font-bold text-white shadow-sm transition-all'
                      : 'flex h-9 min-w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-[11.5px] font-semibold text-muted transition-all hover:border-brand-300 hover:text-brand-600 dark:hover:border-brand-400/40 dark:hover:text-brand-300'
                  }
                >
                  {day.key}
                </button>
              )
            })}
          </div>
        </Field>
        <FormGrid className="mt-4">
          <Field
            label="Dars vaqti"
            htmlFor="groupTime"
            error={errors.time}
            hint="Format: 14:00 — 15:30"
            required
          >
            <Input
              id="groupTime"
              placeholder="14:00 — 15:30"
              value={values.time}
              onChange={(event) => setField('time', event.target.value)}
              error={Boolean(errors.time)}
            />
          </Field>
          <Field label="Xona" htmlFor="groupRoom" error={errors.room} required>
            <Input
              id="groupRoom"
              placeholder="101"
              value={values.room}
              onChange={(event) => setField('room', event.target.value)}
              error={Boolean(errors.room)}
            />
          </Field>
          <Field label="Boshlanish sanasi" htmlFor="groupStartDate" error={errors.startDate} required>
            <Input
              id="groupStartDate"
              type="date"
              value={values.startDate}
              onChange={(event) => setField('startDate', event.target.value)}
              error={Boolean(errors.startDate)}
            />
          </Field>
          <Field label="Holat" htmlFor="groupStatus">
            <Select
              id="groupStatus"
              value={values.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              {Object.entries(GROUP_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Qo'shimcha">
        <Field label="Izohlar" htmlFor="groupNotes">
          <Textarea
            id="groupNotes"
            rows={3}
            placeholder="Guruh haqida qo'shimcha eslatmalar..."
            value={values.notes || ''}
            onChange={(event) => setField('notes', event.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  )
}
