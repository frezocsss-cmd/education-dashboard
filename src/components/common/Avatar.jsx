import { memo, useState } from 'react'
import { avatarGradient, getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
}

const STATUS_DOT = {
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
  vacation: 'bg-amber-500',
  online: 'bg-emerald-500',
}

function Avatar({
  firstName = '',
  lastName = '',
  name = '',
  src,
  size = 'md',
  status,
  className = '',
  ring = false,
}) {
  const [failed, setFailed] = useState(false)
  const initials = getInitials(firstName || name, lastName)
  const seed = `${firstName}${lastName}` || name || 'avatar'
  const showImage = Boolean(src) && !failed

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {showImage ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`.trim() || name}
          onError={() => setFailed(true)}
          className={cn(
            'rounded-full object-cover',
            SIZES[size],
            ring && 'ring-2 ring-white/70 dark:ring-white/15',
          )}
        />
      ) : (
        <div
          style={{ background: avatarGradient(seed) }}
          className={cn(
            'flex items-center justify-center rounded-full font-bold tracking-wide text-white shadow-sm',
            SIZES[size],
            ring && 'ring-2 ring-white/70 dark:ring-white/15',
          )}
        >
          {initials}
        </div>
      )}
      {status && STATUS_DOT[status] && (
        <span
          className={cn(
            'absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-[var(--surface)]',
            STATUS_DOT[status],
          )}
        />
      )}
    </div>
  )
}

export default memo(Avatar)
