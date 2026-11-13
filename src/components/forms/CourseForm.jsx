import { useMemo } from 'react'
import {
  Checkbox,
  Field,
  FormGrid,
  FormSection,
  Input,
  Select,
  Textarea,
} from '@/components/common/FormControls'
import { COURSE_COLORS } from '@/utils/constants'
import { isPositiveNumber, required, validateFields } from '@/utils/validation'
import { todayISO } from '@/utils/format'
import { fullName } from '@/utils/stats'
import { useForm } from '@/hooks/useApi'

const DEFAULT_VALUES = {
  name: '',
  description: '',
  duration: '',
  price: '',
  levels: '',
  color: 'violet',
  teacherIds: [],
  createdAt: todayISO(),
}

function toFormValues(course) {
  if (!course) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...course,
    duration: course.duration ?? '',
    price: course.price ?? '',
    levels: course.levels ?? '',
    teacherIds: (course.teacherIds || []).map(String),
  }
}

export default function CourseForm({
  formId = 'course-form',
  initialValues,
  teachers = [],
  onSubmit,
}) {
  const { values, errors, setField, setErrors } = useForm(toFormValues(initialValues))

  const sortedTeachers = useMemo(
    () => [...teachers].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [teachers],
  )

  function toggleTeacher(id) {
    const key = String(id)
    setField(
      'teacherIds',
      values.teacherIds.includes(key)
        ? values.teacherIds.filter((item) => item !== key)
        : [...values.teacherIds, key],
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      name: [(value) => required(value, 'Kurs nomini kiriting')],
      description: [(value) => required(value, 'Kurs tavsifini kiriting')],
      duration: [(value) => isPositiveNumber(value, 'Davomiylikni oylarda kiriting')],
      price: [(value) => isPositiveNumber(value, "Oylik narxni kiriting")],
      levels: [(value) => isPositiveNumber(value, 'Darajalar sonini kiriting')],
      color: [(value) => required(value, 'Rangni tanlang')],
      teacherIds: [(value) => required(value, "Kamida bitta o'qituvchi tanlang")],
    })

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      duration: Number(values.duration),
      price: Number(values.price),
      levels: Number(values.levels),
      teacherIds: values.teacherIds.map(Number),
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection title="Kurs ma'lumotlari" description="Nomi, tavsifi va o'quv shartlari.">
        <FormGrid>
          <Field label="Kurs nomi" htmlFor="courseName" error={errors.name} required>
            <Input
              id="courseName"
              autoFocus
              placeholder="Masalan: Ingliz tili"
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              error={Boolean(errors.name)}
            />
          </Field>
          <Field label="Rang belgisi" htmlFor="courseColor" error={errors.color} required>
            <Select
              id="courseColor"
              value={values.color}
              onChange={(event) => setField('color', event.target.value)}
              error={Boolean(errors.color)}
            >
              {COURSE_COLORS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Kurs tavsifi"
            htmlFor="courseDescription"
            error={errors.description}
            required
            className="sm:col-span-2"
          >
            <Textarea
              id="courseDescription"
              rows={3}
              placeholder="Kurs davomida qanday ko'nikmalar o'rgatiladi..."
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
              error={Boolean(errors.description)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="O'quv parametrlari">
        <FormGrid>
          <Field
            label="Davomiylik (oy)"
            htmlFor="courseDuration"
            error={errors.duration}
            required
          >
            <Input
              id="courseDuration"
              type="number"
              min="1"
              max="36"
              placeholder="12"
              value={values.duration}
              onChange={(event) => setField('duration', event.target.value)}
              error={Boolean(errors.duration)}
            />
          </Field>
          <Field label="Darajalar soni" htmlFor="courseLevels" error={errors.levels} required>
            <Input
              id="courseLevels"
              type="number"
              min="1"
              max="8"
              placeholder="4"
              value={values.levels}
              onChange={(event) => setField('levels', event.target.value)}
              error={Boolean(errors.levels)}
            />
          </Field>
          <Field
            label="Oylik narx (so'm)"
            htmlFor="coursePrice"
            error={errors.price}
            required
            className="sm:col-span-2"
          >
            <Input
              id="coursePrice"
              type="number"
              min="0"
              step="50000"
              placeholder="600000"
              value={values.price}
              onChange={(event) => setField('price', event.target.value)}
              error={Boolean(errors.price)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="O'qituvchilar"
        description="Bu kursda dars beradigan o'qituvchilarni belgilang."
      >
        {errors.teacherIds && (
          <p className="text-[11.5px] font-medium text-rose-500">{errors.teacherIds}</p>
        )}
        {sortedTeachers.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-4 text-center text-xs text-subtle">
            O'qituvchilar mavjud emas. Avval o'qituvchi qo'shing.
          </p>
        ) : (
          <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 sm:grid-cols-2">
            {sortedTeachers.map((teacher) => (
              <div key={teacher.id} className="rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-3)]">
                <Checkbox
                  checked={values.teacherIds.includes(String(teacher.id))}
                  onChange={() => toggleTeacher(teacher.id)}
                  label={fullName(teacher)}
                  description={teacher.specialization}
                />
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </form>
  )
}
