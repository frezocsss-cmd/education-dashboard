import { forwardRef, memo } from 'react'
import { cn } from '@/utils/cn'

export function Field({ label, htmlFor, error, hint, required, children, className = '' }) {
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-[11.5px] font-medium text-rose-500">
          <span className="mt-px">•</span>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] text-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = memo(
  forwardRef(function Input(
    { className = '', error = false, icon: Icon, suffix, ...props },
    ref,
  ) {
    if (Icon || suffix) {
      return (
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-3)]" />
          )}
          <input
            ref={ref}
            className={cn('input', Icon && 'pl-9.5', suffix && 'pr-10', error && 'input-error', className)}
            aria-invalid={error || undefined}
            {...props}
          />
          {suffix && (
            <div className="absolute top-1/2 right-2 -translate-y-1/2">{suffix}</div>
          )}
        </div>
      )
    }
    return (
      <input
        ref={ref}
        className={cn('input', error && 'input-error', className)}
        aria-invalid={error || undefined}
        {...props}
      />
    )
  }),
)

export const Select = memo(
  forwardRef(function Select({ className = '', error = false, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn('input select', error && 'input-error', className)}
        aria-invalid={error || undefined}
        {...props}
      >
        {children}
      </select>
    )
  }),
)

export const Textarea = memo(
  forwardRef(function Textarea({ className = '', error = false, rows = 3, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn('input resize-none', error && 'input-error', className)}
        aria-invalid={error || undefined}
        {...props}
      />
    )
  }),
)

export function Checkbox({ label, description, checked, onChange, className = '' }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 select-none', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-[var(--border-strong)] accent-brand-600"
      />
      <span>
        <span className="text-[13px] font-medium text-[var(--text)]">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-subtle">{description}</span>}
      </span>
    </label>
  )
}

export function Switch({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-[13px] font-semibold text-[var(--text)]">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-subtle">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-white/15',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  )
}

export function FormGrid({ children, className = '' }) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>{children}</div>
}

export function FormSection({ title, description, children, className = '' }) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description) && (
        <div>
          {title && (
            <h4 className="text-[13px] font-bold tracking-tight text-[var(--text)]">{title}</h4>
          )}
          {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
