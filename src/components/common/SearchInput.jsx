import { memo } from 'react'
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2'
import { cn } from '@/utils/cn'

function SearchInput({
  value,
  onChange,
  placeholder = 'Qidirish...',
  className = '',
  inputClassName = '',
  ariaLabel = 'Qidirish',
}) {
  return (
    <div className={cn('relative', className)}>
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-3)]" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'input pr-9 pl-9.5 [&::-webkit-search-cancel-button]:hidden',
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
          aria-label="Qidiruvni tozalash"
        >
          <HiOutlineXMark className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export default memo(SearchInput)
