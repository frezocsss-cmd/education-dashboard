import { useMemo, useState } from 'react'
import {
  Checkbox,
  Field,
  FormGrid,
  FormSection,
  Input,
  Textarea,
} from '@/components/common/FormControls'
import { isEmail, isPhone, required, validateFields } from '@/utils/validation'
import { fullName } from '@/utils/stats'
import { useForm } from '@/hooks/useApi'

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  studentIds: [],
  notes: '',
}

function toFormValues(parent) {
  if (!parent) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...parent,
    studentIds: (parent.studentIds || []).map(String),
  }
}

export default function ParentForm({
  formId = 'parent-form',
  initialValues,
  students = [],
  groups = [],
  onSubmit,
}) {
  const { values, errors, setField, setErrors, setManyValues } = useForm(
    toFormValues(initialValues),
  )
  const [studentSearch, setStudentSearch] = useState('')

  const groupMap = useMemo(
    () => new Map(groups.map((group) => [String(group.id), group])),
    [groups],
  )

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase()
    return [...students]
      .filter((student) => {
        if (!search) return true
        return `${student.firstName} ${student.lastName} ${student.phone}`
          .toLowerCase()
          .includes(search)
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)))
  }, [students, studentSearch])

  function toggleStudent(id) {
    const key = String(id)
    const exists = values.studentIds.includes(key)
    setField(
      'studentIds',
      exists ? values.studentIds.filter((item) => item !== key) : [...values.studentIds, key],
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      firstName: [(value) => required(value, 'Ism kiritilishi shart')],
      lastName: [(value) => required(value, 'Familiya kiritilishi shart')],
      phone: [isPhone],
      email: [isEmail],
      address: [(value) => required(value, 'Manzil kiritilishi shart')],
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
      email: values.email.trim(),
      address: values.address.trim(),
      notes: values.notes.trim(),
      studentIds: values.studentIds.map(Number),
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection
        title="Shaxsiy ma'lumotlar"
        description="Ota-onaning asosiy aloqa ma'lumotlari."
      >
        <FormGrid>
          <Field label="Ism" htmlFor="firstName" error={errors.firstName} required>
            <Input
              id="firstName"
              autoFocus
              placeholder="Masalan: Rustam"
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
              placeholder="+998 93 200 11 22"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
              error={Boolean(errors.phone)}
            />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            error={errors.email}
            hint="Ixtiyoriy — bildirishnomalar uchun"
          >
            <Input
              id="email"
              type="email"
              placeholder="parent@mail.uz"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              error={Boolean(errors.email)}
            />
          </Field>
          <Field
            label="Yashash manzili"
            htmlFor="address"
            error={errors.address}
            required
            className="sm:col-span-2"
          >
            <Input
              id="address"
              placeholder="Toshkent, Yunusobod, 4-mavze, 12-uy"
              value={values.address}
              onChange={(event) => setField('address', event.target.value)}
              error={Boolean(errors.address)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Farzandlar"
        description="Ota-onaga bog'langan o'quvchilarni belgilang."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="O'quvchi ismi yoki telefoni bo'yicha qidirish..."
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            aria-label="O'quvchilarni qidirish"
          />
          <span className="chip shrink-0 self-start sm:self-auto">
            {values.studentIds.length} ta tanlangan
          </span>
        </div>

        <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2">
          {filteredStudents.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-subtle">
              Qidiruv bo'yicha o'quvchi topilmadi.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {filteredStudents.map((student) => {
                const group = groupMap.get(String(student.groupId))
                return (
                  <div
                    key={student.id}
                    className="rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-3)]"
                  >
                    <Checkbox
                      checked={values.studentIds.includes(String(student.id))}
                      onChange={() => toggleStudent(student.id)}
                      label={fullName(student)}
                      description={group ? group.name : student.level}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setManyValues({ studentIds: [] })}
          className="text-[11px] font-semibold text-subtle transition-colors hover:text-rose-500"
        >
          Tanlovni tozalash
        </button>
      </FormSection>

      <FormSection title="Qo'shimcha">
        <Field label="Izohlar" htmlFor="notes">
          <Textarea
            id="notes"
            rows={3}
            placeholder="To'lov tartibi yoki aloqaga oid eslatmalar..."
            value={values.notes}
            onChange={(event) => setField('notes', event.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  )
}
