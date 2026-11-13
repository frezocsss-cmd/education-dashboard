import { HiOutlineAcademicCap } from 'react-icons/hi2'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: { box: 'size-8 rounded-[0.6rem]', icon: 'size-4' },
  md: { box: 'size-10 rounded-xl', icon: 'size-5' },
  lg: { box: 'size-12 rounded-2xl', icon: 'size-6' },
  xl: { box: 'size-14 rounded-2xl', icon: 'size-7' },
}

export function LogoMark({ size = 'md', className = '' }) {
  const meta = SIZES[size] || SIZES.md
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-700 text-white shadow-lg shadow-brand-600/25',
        meta.box,
        className,
      )}
    >
      <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
      <HiOutlineAcademicCap className={cn('relative', meta.icon)} />
    </div>
  )
}

export default function Brand({ collapsed = false, size = 'md', className = '', tone = 'default' }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {!collapsed && (
        <div className="min-w-0">
          <p
            className={cn(
              'text-[15px] leading-tight font-extrabold tracking-[-0.035em]',
              tone === 'light' ? 'text-white' : 'text-[var(--text)]',
            )}
          >
            Nexus<span className="text-brand-500">.</span>
          </p>
          <p
            className={cn(
              'mt-0.5 text-[8.5px] font-bold tracking-[0.24em] uppercase',
              tone === 'light' ? 'text-white/60' : 'text-subtle',
            )}
          >
            Education
          </p>
        </div>
      )}
    </div>
  )
}
