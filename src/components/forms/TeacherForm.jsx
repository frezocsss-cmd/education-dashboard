import { Field, FormGrid, FormSection, Input, Select, Textarea } from '@/components/common/FormControls'
import { PERSON_STATUS } from '@/utils/constants'
import { todayISO } from '@/utils/format'
import { useForm } from '@/hooks/useApi'
import { isDate, isEmail, isPhone, isPositiveNumber, required, validateFields } from '@/utils/validation'

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  specialization: '',
  experience: '',
  salary: '',
  joinDate: todayISO(),
  status: 'active',
  photo: '',
  notes: '',
}

function toFormValues(teacher) {
  if (!teacher) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...teacher,
    experience: teacher.experience ?? '',
    salary: teacher.salary ?? '',
    photo: teacher.photo || '',
    notes: teacher.notes || '',
  }
}

export default function TeacherForm({
  formId = 'teacher-form',
  initialValues,
  onSubmit,
}) {
  const { values, errors, setField, setErrors } = useForm(toFormValues(initialValues))

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      firstName: [(value) => required(value, 'Ism kiritilishi shart')],
      lastName: [(value) => required(value, 'Familiya kiritilishi shart')],
      phone: [isPhone],
      email: [(value) => isEmail(value, { optional: false })],
      specialization: [(value) => required(value, "Mutaxassislikni kiriting")],
      experience: [(value) => isPositiveNumber(value, "Tajriba yillarini kiriting")],
      salary: [(value) => isPositiveNumber(value, "Maosh summasini kiriting")],
      joinDate: [isDate],
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
      email: values.email.trim().toLowerCase(),
      specialization: values.specialization.trim(),
      experience: Number(values.experience),
      salary: Number(values.salary),
      photo: values.photo.trim(),
      notes: values.notes.trim(),
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection title="Shaxsiy ma'lumotlar">
        <FormGrid>
          <Field label="Ism" htmlFor="teacherFirstName" error={errors.firstName} required>
            <Input
              id="teacherFirstName"
              autoFocus
              placeholder="Masalan: Dilnoza"
              value={values.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
              error={Boolean(errors.firstName)}
            />
          </Field>
          <Field label="Familiya" htmlFor="teacherLastName" error={errors.lastName} required>
            <Input
              id="teacherLastName"
              placeholder="Masalan: Rahimova"
              value={values.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
              error={Boolean(errors.lastName)}
            />
          </Field>
          <Field label="Telefon raqam" htmlFor="teacherPhone" error={errors.phone} required>
            <Input
              id="teacherPhone"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
              error={Boolean(errors.phone)}
            />
          </Field>
          <Field label="Email" htmlFor="teacherEmail" error={errors.email} required>
            <Input
              id="teacherEmail"
              type="email"
              placeholder="ism.familiya@nexusedu.uz"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              error={Boolean(errors.email)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Kasbiy ma'lumotlar">
        <FormGrid>
          <Field
            label="Mutaxassislik"
            htmlFor="specialization"
            error={errors.specialization}
            required
          >
            <Input
              id="specialization"
              placeholder="Masalan: IELTS"
              value={values.specialization}
              onChange={(event) => setField('specialization', event.target.value)}
              error={Boolean(errors.specialization)}
            />
          </Field>
          <Field label="Ish tajribasi (yil)" htmlFor="experience" error={errors.experience} required>
            <Input
              id="experience"
              type="number"
              min="0"
              max="60"
              value={values.experience}
              onChange={(event) => setField('experience', event.target.value)}
              error={Boolean(errors.experience)}
            />
          </Field>
          <Field label="Oylik maosh (so'm)" htmlFor="salary" error={errors.salary} required>
            <Input
              id="salary"
              type="number"
              min="0"
              step="100000"
              placeholder="6500000"
              value={values.salary}
              onChange={(event) => setField('salary', event.target.value)}
              error={Boolean(errors.salary)}
            />
          </Field>
          <Field label="Ishga qabul sanasi" htmlFor="joinDate" error={errors.joinDate} required>
            <Input
              id="joinDate"
              type="date"
              value={values.joinDate}
              onChange={(event) => setField('joinDate', event.target.value)}
              error={Boolean(errors.joinDate)}
            />
          </Field>
          <Field label="Holat" htmlFor="teacherStatus">
            <Select
              id="teacherStatus"
              value={values.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              {Object.entries(PERSON_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rasm URL (ixtiyoriy)" htmlFor="teacherPhoto">
            <Input
              id="teacherPhoto"
              type="url"
              placeholder="https://..."
              value={values.photo}
              onChange={(event) => setField('photo', event.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Qo'shimcha">
        <Field label="Izohlar" htmlFor="teacherNotes">
          <Textarea
            id="teacherNotes"
            rows={3}
            placeholder="Sertifikatlar, yutuqlar yoki boshqa eslatmalar..."
            value={values.notes}
            onChange={(event) => setField('notes', event.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  )
}
