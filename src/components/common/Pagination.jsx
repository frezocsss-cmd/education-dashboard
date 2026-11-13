import { useMemo } from 'react'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2'
import { cn } from '@/utils/cn'

function getPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

export default function Pagination({ page, pageSize, total, onChange, className = '' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = useMemo(() => getPages(page, totalPages), [page, totalPages])
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  if (total === 0) return null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-xs text-muted">
        <span className="font-semibold text-[var(--text)]">
          {from}–{to}
        </span>{' '}
        / {total} ta yozuv
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="icon-btn icon-btn-sm disabled:pointer-events-none disabled:opacity-40"
          aria-label="Oldingi sahifa"
        >
          <HiOutlineChevronLeft className="size-4" />
        </button>
        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-subtle">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                item === page
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                  : 'text-muted hover:bg-[var(--surface-3)] hover:text-[var(--text)]',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="icon-btn icon-btn-sm disabled:pointer-events-none disabled:opacity-40"
          aria-label="Keyingi sahifa"
        >
          <HiOutlineChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
