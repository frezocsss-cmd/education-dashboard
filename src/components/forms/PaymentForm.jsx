import { useMemo } from 'react'
import { Field, FormGrid, FormSection, Input, Select, Textarea } from '@/components/common/FormControls'
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/utils/constants'
import { isDate, isNonNegativeNumber, isPositiveNumber, required, validateFields } from '@/utils/validation'
import { monthKey, todayISO } from '@/utils/format'
import { fullName } from '@/utils/stats'
import { useForm } from '@/hooks/useApi'

const DEFAULT_VALUES = {
  studentId: '',
  amount: '',
  paidAmount: '',
  month: monthKey(new Date()),
  date: todayISO(),
  status: 'paid',
  method: 'cash',
  note: '',
}

function toFormValues(payment) {
  if (!payment) return DEFAULT_VALUES
  return {
    ...DEFAULT_VALUES,
    ...payment,
    studentId: payment.studentId ? String(payment.studentId) : '',
    amount: payment.amount ?? '',
    paidAmount: payment.paidAmount ?? '',
    note: payment.note || '',
  }
}

export default function PaymentForm({
  formId = 'payment-form',
  initialValues,
  students = [],
  groups = [],
  onSubmit,
}) {
  const { values, errors, setField, setErrors, setManyValues } = useForm(
    toFormValues(initialValues),
  )

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [students],
  )
  const groupMap = useMemo(
    () => new Map(groups.map((group) => [String(group.id), group])),
    [groups],
  )

  function handleStudentChange(value) {
    const student = students.find((item) => String(item.id) === value)
    setManyValues({
      studentId: value,
      ...(student
        ? {
            amount: String(student.monthlyFee || ''),
            paidAmount:
              values.status === 'paid'
                ? String(student.monthlyFee || '')
                : values.status === 'unpaid'
                  ? '0'
                  : values.paidAmount,
          }
        : {}),
    })
  }

  function handleStatusChange(status) {
    const amount = Number(values.amount) || 0
    if (status === 'paid') {
      setManyValues({ status, paidAmount: String(amount) })
    } else if (status === 'unpaid') {
      setManyValues({ status, paidAmount: '0' })
    } else {
      const current = Number(values.paidAmount) || 0
      setManyValues({
        status,
        paidAmount: current > 0 && current < amount ? String(current) : String(Math.round(amount / 2)),
      })
    }
  }

  function handlePaidAmountChange(value) {
    const amount = Number(values.amount) || 0
    const paid = Number(value) || 0
    let status = values.status
    if (paid >= amount && amount > 0) status = 'paid'
    else if (paid > 0) status = 'partial'
    else status = 'unpaid'
    setManyValues({ paidAmount: value, status })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      studentId: [(value) => required(value, "O'quvchini tanlang")],
      amount: [(value) => isPositiveNumber(value, "To'lov summasini kiriting")],
      paidAmount: [
        (value) => isNonNegativeNumber(value, "To'langan summani kiriting"),
        (value) =>
          Number(value) > Number(values.amount)
            ? "To'langan summa umumiy summadan oshmasligi kerak"
            : '',
      ],
      month: [(value) => required(value, 'Oyni tanlang')],
      date: [isDate],
      method: [(value) => required(value, "To'lov usulini tanlang")],
    })

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      ...values,
      studentId: Number(values.studentId),
      amount: Number(values.amount),
      paidAmount: Number(values.paidAmount),
      note: values.note.trim(),
    })
  }

  const amount = Number(values.amount) || 0
  const paidAmount = Number(values.paidAmount) || 0
  const debt = Math.max(amount - paidAmount, 0)

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection title="To'lov ma'lumotlari" description="O'quvchi, oy va summalar.">
        <FormGrid>
          <Field
            label="O'quvchi"
            htmlFor="paymentStudent"
            error={errors.studentId}
            required
            className="sm:col-span-2"
          >
            <Select
              id="paymentStudent"
              value={values.studentId}
              onChange={(event) => handleStudentChange(event.target.value)}
              error={Boolean(errors.studentId)}
            >
              <option value="">O'quvchini tanlang</option>
              {sortedStudents.map((student) => {
                const group = groupMap.get(String(student.groupId))
                return (
                  <option key={student.id} value={student.id}>
                    {fullName(student)} — {group?.name || 'guruhsiz'}
                  </option>
                )
              })}
            </Select>
          </Field>
          <Field
            label="To'lov oyi"
            htmlFor="paymentMonth"
            error={errors.month}
            required
          >
            <Input
              id="paymentMonth"
              type="month"
              value={values.month}
              onChange={(event) => setField('month', event.target.value)}
              error={Boolean(errors.month)}
            />
          </Field>
          <Field label="To'lov sanasi" htmlFor="paymentDate" error={errors.date} required>
            <Input
              id="paymentDate"
              type="date"
              value={values.date}
              onChange={(event) => setField('date', event.target.value)}
              error={Boolean(errors.date)}
            />
          </Field>
          <Field label="Umumiy summa (so'm)" htmlFor="paymentAmount" error={errors.amount} required>
            <Input
              id="paymentAmount"
              type="number"
              min="0"
              step="50000"
              placeholder="600000"
              value={values.amount}
              onChange={(event) => setField('amount', event.target.value)}
              error={Boolean(errors.amount)}
            />
          </Field>
          <Field
            label="To'langan summa (so'm)"
            htmlFor="paymentPaid"
            error={errors.paidAmount}
            required
          >
            <Input
              id="paymentPaid"
              type="number"
              min="0"
              step="50000"
              placeholder="600000"
              value={values.paidAmount}
              onChange={(event) => handlePaidAmountChange(event.target.value)}
              error={Boolean(errors.paidAmount)}
            />
          </Field>
        </FormGrid>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">Summa</p>
            <p className="mt-1 text-[12px] font-bold text-[var(--text)]">
              {new Intl.NumberFormat('ru-RU').format(amount)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">To'langan</p>
            <p className="mt-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('ru-RU').format(paidAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">Qarz</p>
            <p
              className={
                debt > 0
                  ? 'mt-1 text-[12px] font-bold text-rose-600 dark:text-rose-400'
                  : 'mt-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400'
              }
            >
              {new Intl.NumberFormat('ru-RU').format(debt)}
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="To'lov usuli va holati">
        <FormGrid>
          <Field label="Holat" htmlFor="paymentStatus">
            <Select
              id="paymentStatus"
              value={values.status}
              onChange={(event) => handleStatusChange(event.target.value)}
            >
              {Object.entries(PAYMENT_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To'lov usuli" htmlFor="paymentMethod" error={errors.method} required>
            <Select
              id="paymentMethod"
              value={values.method}
              onChange={(event) => setField('method', event.target.value)}
              error={Boolean(errors.method)}
            >
              {Object.entries(PAYMENT_METHODS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Izoh" htmlFor="paymentNote" className="sm:col-span-2">
            <Textarea
              id="paymentNote"
              rows={2}
              placeholder="To'lovga oid qo'shimcha izoh..."
              value={values.note}
              onChange={(event) => setField('note', event.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>
    </form>
  )
}
