import { Field, FormGrid, FormSection, Input, Select, Textarea } from '@/components/common/FormControls'
import { PERSON_STATUS } from '@/utils/constants'
import { todayISO } from '@/utils/format'
import { useForm } from '@/hooks/useApi'
import { isDate, isPhone, isPositiveNumber, required, validateFields } from '@/utils/validation'

const DEFAULT_VALUES = {
  firstName: '',
  lastName: '',
  phone: '',
  position: '',
  salary: '',
  joinDate: todayISO(),
  schedule: '09:00 — 18:00',
  status: 'active',
  photo: '',
  notes: '',
}

function toFormValues(employee) {
  if (!employee) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...employee,
    salary: employee.salary ?? '',
    photo: employee.photo || '',
    notes: employee.notes || '',
  }
}

export default function EmployeeForm({ formId = 'employee-form', initialValues, onSubmit }) {
  const { values, errors, setField, setErrors } = useForm(toFormValues(initialValues))

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      firstName: [(value) => required(value, 'Ism kiritilishi shart')],
      lastName: [(value) => required(value, 'Familiya kiritilishi shart')],
      phone: [isPhone],
      position: [(value) => required(value, 'Lavozimni kiriting')],
      salary: [(value) => isPositiveNumber(value, "Maosh summasini kiriting")],
      joinDate: [isDate],
      schedule: [(value) => required(value, 'Ish jadvalini kiriting')],
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
      position: values.position.trim(),
      salary: Number(values.salary),
      schedule: values.schedule.trim(),
      photo: values.photo.trim(),
      notes: values.notes.trim(),
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection title="Shaxsiy ma'lumotlar">
        <FormGrid>
          <Field label="Ism" htmlFor="employeeFirstName" error={errors.firstName} required>
            <Input
              id="employeeFirstName"
              autoFocus
              placeholder="Masalan: Zilola"
              value={values.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
              error={Boolean(errors.firstName)}
            />
          </Field>
          <Field label="Familiya" htmlFor="employeeLastName" error={errors.lastName} required>
            <Input
              id="employeeLastName"
              placeholder="Masalan: Xudoyberdiyeva"
              value={values.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
              error={Boolean(errors.lastName)}
            />
          </Field>
          <Field label="Telefon raqam" htmlFor="employeePhone" error={errors.phone} required>
            <Input
              id="employeePhone"
              type="tel"
              placeholder="+998 97 100 55 00"
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
              error={Boolean(errors.phone)}
            />
          </Field>
          <Field label="Rasm URL (ixtiyoriy)" htmlFor="employeePhoto">
            <Input
              id="employeePhoto"
              type="url"
              placeholder="https://..."
              value={values.photo}
              onChange={(event) => setField('photo', event.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Ish ma'lumotlari">
        <FormGrid>
          <Field label="Lavozim" htmlFor="position" error={errors.position} required>
            <Input
              id="position"
              placeholder="Masalan: Buxgalter"
              value={values.position}
              onChange={(event) => setField('position', event.target.value)}
              error={Boolean(errors.position)}
            />
          </Field>
          <Field label="Oylik maosh (so'm)" htmlFor="employeeSalary" error={errors.salary} required>
            <Input
              id="employeeSalary"
              type="number"
              min="0"
              step="100000"
              placeholder="5000000"
              value={values.salary}
              onChange={(event) => setField('salary', event.target.value)}
              error={Boolean(errors.salary)}
            />
          </Field>
          <Field label="Ishga qabul sanasi" htmlFor="employeeJoinDate" error={errors.joinDate} required>
            <Input
              id="employeeJoinDate"
              type="date"
              value={values.joinDate}
              onChange={(event) => setField('joinDate', event.target.value)}
              error={Boolean(errors.joinDate)}
            />
          </Field>
          <Field
            label="Ish jadvali"
            htmlFor="schedule"
            error={errors.schedule}
            hint="Masalan: 09:00 — 18:00"
            required
          >
            <Input
              id="schedule"
              placeholder="09:00 — 18:00"
              value={values.schedule}
              onChange={(event) => setField('schedule', event.target.value)}
              error={Boolean(errors.schedule)}
            />
          </Field>
          <Field label="Holat" htmlFor="employeeStatus">
            <Select
              id="employeeStatus"
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
        </FormGrid>
      </FormSection>

      <FormSection title="Qo'shimcha">
        <Field label="Izohlar" htmlFor="employeeNotes">
          <Textarea
            id="employeeNotes"
            rows={3}
            placeholder="Xodim haqida qo'shimcha ma'lumot..."
            value={values.notes}
            onChange={(event) => setField('notes', event.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  )
}
