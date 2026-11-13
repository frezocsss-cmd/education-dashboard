import { useMemo } from 'react'
import { Field, FormGrid, FormSection, Input, Select, Textarea } from '@/components/common/FormControls'
import { LEVELS, PAYMENT_STATUS } from '@/utils/constants'
import { isDate, isPhone, isPositiveNumber, required, validateFields } from '@/utils/validation'
import { todayISO } from '@/utils/format'
import { useForm } from '@/hooks/useApi'

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  phone: '',
  parentId: '',
  parentName: '',
  parentPhone: '',
  courseId: '',
  groupId: '',
  level: "Boshlang'ich",
  enrollmentDate: todayISO(),
  monthlyFee: '',
  paymentStatus: 'paid',
  photo: '',
  notes: '',
}

function toFormValues(student) {
  if (!student) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...student,
    parentId: student.parentId ? String(student.parentId) : '',
    courseId: student.courseId ? String(student.courseId) : '',
    groupId: student.groupId ? String(student.groupId) : '',
    monthlyFee: student.monthlyFee ?? '',
    photo: student.photo || '',
    notes: student.notes || '',
  }
}

export default function StudentForm({
  formId = 'student-form',
  initialValues,
  parents = [],
  courses = [],
  groups = [],
  onSubmit,
}) {
  const { values, errors, setField, setErrors, setManyValues } = useForm(
    toFormValues(initialValues),
  )

  const sortedParents = useMemo(
    () =>
      [...parents].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
      ),
    [parents],
  )

  const groupOptions = useMemo(() => {
    const filtered = values.courseId
      ? groups.filter((group) => String(group.courseId) === String(values.courseId))
      : groups
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [groups, values.courseId])

  function handleParentChange(value) {
    const parent = parents.find((item) => String(item.id) === value)
    setManyValues({
      parentId: value,
      ...(parent
        ? {
            parentName: `${parent.firstName} ${parent.lastName}`,
            parentPhone: parent.phone,
          }
        : {}),
    })
  }

  function handleCourseChange(value) {
    const course = courses.find((item) => String(item.id) === value)
    setManyValues({
      courseId: value,
      groupId: '',
      ...(course ? { monthlyFee: String(course.price) } : {}),
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      firstName: [(value) => required(value, 'Ism kiritilishi shart')],
      lastName: [(value) => required(value, 'Familiya kiritilishi shart')],
      phone: [isPhone],
      parentName: [(value) => required(value, "Ota-ona ismi kiritilishi shart")],
      parentPhone: [isPhone],
      courseId: [(value) => required(value, 'Kursni tanlang')],
      groupId: [(value) => required(value, 'Guruhni tanlang')],
      level: [(value) => required(value, 'Darajani tanlang')],
      enrollmentDate: [isDate],
      monthlyFee: [(value) => isPositiveNumber(value, "Oylik to'lov summasini kiriting")],
    })

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
      parentId: values.parentId ? Number(values.parentId) : null,
      courseId: Number(values.courseId),
      groupId: Number(values.groupId),
      monthlyFee: Number(values.monthlyFee),
      photo: values.photo.trim(),
      notes: values.notes.trim(),
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection
        title="Shaxsiy ma'lumotlar"
        description="O'quvchining asosiy aloqa ma'lumotlari."
      >
        <FormGrid>
          <Field label="Ism" htmlFor="firstName" error={errors.firstName} required>
            <Input
              id="firstName"
              autoFocus
              placeholder="Masalan: Aziz"
              value={values.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
              error={Boolean(errors.firstName)}
            />
          </Field>
          <Field label="Familiya" htmlFor="lastName" error={errors.lastName} required>
            <Input
              id="lastName"
              placeholder="Masalan: Karimov"
              value={values.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
              error={Boolean(errors.lastName)}
            />
          </Field>
          <Field label="Telefon raqam" htmlFor="phone" error={errors.phone} required>
            <Input
              id="phone"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
              error={Boolean(errors.phone)}
            />
          </Field>
          <Field
            label="Qabul sanasi"
            htmlFor="enrollmentDate"
            error={errors.enrollmentDate}
            required
          >
            <Input
              id="enrollmentDate"
              type="date"
              value={values.enrollmentDate}
              onChange={(event) => setField('enrollmentDate', event.target.value)}
              error={Boolean(errors.enrollmentDate)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Ota-ona ma'lumotlari"
        description="Mavjud ota-onani tanlasangiz, maydonlar avtomatik to'ldiriladi."
      >
        <Field label="Ota-ona (ma'lumotlar bazasidan)" htmlFor="parentId">
          <Select
            id="parentId"
            value={values.parentId}
            onChange={(event) => handleParentChange(event.target.value)}
          >
            <option value="">Yangi / mustaqil kiritish</option>
            {sortedParents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.firstName} {parent.lastName} — {parent.phone}
              </option>
            ))}
          </Select>
        </Field>
        <FormGrid className="mt-4">
          <Field label="Ota-ona ismi" htmlFor="parentName" error={errors.parentName} required>
            <Input
              id="parentName"
              placeholder="Masalan: Rustam Karimov"
              value={values.parentName}
              onChange={(event) => setField('parentName', event.target.value)}
              error={Boolean(errors.parentName)}
            />
          </Field>
          <Field
            label="Ota-ona telefoni"
            htmlFor="parentPhone"
            error={errors.parentPhone}
            required
          >
            <Input
              id="parentPhone"
              type="tel"
              placeholder="+998 93 200 11 22"
              value={values.parentPhone}
              onChange={(event) => setField('parentPhone', event.target.value)}
              error={Boolean(errors.parentPhone)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Ta'lim ma'lumotlari" description="Kurs, guruh va to'lov shartlari.">
        <FormGrid>
          <Field label="Kurs" htmlFor="courseId" error={errors.courseId} required>
            <Select
              id="courseId"
              value={values.courseId}
              onChange={(event) => handleCourseChange(event.target.value)}
              error={Boolean(errors.courseId)}
            >
              <option value="">Kursni tanlang</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Guruh"
            htmlFor="groupId"
            error={errors.groupId}
            hint={!values.courseId ? 'Avval kursni tanlang' : undefined}
            required
          >
            <Select
              id="groupId"
              value={values.groupId}
              onChange={(event) => setField('groupId', event.target.value)}
              error={Boolean(errors.groupId)}
              disabled={!groupOptions.length}
            >
              <option value="">
                {values.courseId && !groupOptions.length ? 'Guruh mavjud emas' : 'Guruhni tanlang'}
              </option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} · {group.time}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Daraja" htmlFor="level" error={errors.level} required>
            <Select
              id="level"
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
          <Field
            label="Oylik to'lov (so'm)"
            htmlFor="monthlyFee"
            error={errors.monthlyFee}
            required
          >
            <Input
              id="monthlyFee"
              type="number"
              min="0"
              step="50000"
              placeholder="600000"
              value={values.monthlyFee}
              onChange={(event) => setField('monthlyFee', event.target.value)}
              error={Boolean(errors.monthlyFee)}
            />
          </Field>
          <Field
            label="To'lov holati"
            htmlFor="paymentStatus"
            hint="Oylik to'lovlar bo'limidagi joriy holat"
          >
            <Select
              id="paymentStatus"
              value={values.paymentStatus}
              onChange={(event) => setField('paymentStatus', event.target.value)}
            >
              {Object.entries(PAYMENT_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Rasm URL (ixtiyoriy)"
            htmlFor="photo"
            hint="Bo'sh qoldirsangiz, ism harflaridan avatar yaratiladi"
          >
            <Input
              id="photo"
              type="url"
              placeholder="https://..."
              value={values.photo}
              onChange={(event) => setField('photo', event.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Qo'shimcha">
        <Field label="Izohlar" htmlFor="notes">
          <Textarea
            id="notes"
            rows={3}
            placeholder="O'quvchi haqida qo'shimcha ma'lumot..."
            value={values.notes}
            onChange={(event) => setField('notes', event.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  )
}
