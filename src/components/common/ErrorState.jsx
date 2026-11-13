import { HiOutlineArrowPath, HiOutlineServerStack } from 'react-icons/hi2'
import Button from './Button'

export default function ErrorState({
  title = "Ma'lumotlarni yuklab bo'lmadi",
  description = "Server bilan aloqa uzildi. JSON Server ishlayotganini tekshirib, qayta urinib ko'ring.",
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`card flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400">
        <HiOutlineServerStack className="size-6" />
      </div>
      <h3 className="text-[15px] font-bold tracking-tight text-[var(--text)]">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="primary" size="sm" icon={HiOutlineArrowPath} onClick={onRetry}>
            Qayta urinish
          </Button>
        )}
        <code className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] text-muted">
          npm run server
        </code>
      </div>
    </div>
  )
}
