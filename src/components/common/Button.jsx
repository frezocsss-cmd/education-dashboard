import { memo } from 'react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  soft: 'btn-soft',
  danger: 'btn-danger',
}

const SIZES = {
  sm: '!px-3 !py-1.5 text-[0.8rem]',
  md: '',
  lg: '!px-5 !py-2.5 text-[0.9rem]',
  icon: '!p-2.5',
}

function Spinner({ className }) {
  return (
    <svg className={cn('size-4 animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn('btn', VARIANTS[variant] || VARIANTS.primary, SIZES[size], className)}
      {...props}
    >
      {loading ? <Spinner /> : Icon ? <Icon className="size-4 shrink-0" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="size-4 shrink-0" /> : null}
    </button>
  )
}

export default memo(Button)
export { Spinner }
