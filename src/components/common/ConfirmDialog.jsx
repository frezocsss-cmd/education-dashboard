import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { useConfirmStore } from '@/store/confirmStore'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog() {
  const open = useConfirmStore((state) => state.open)
  const options = useConfirmStore((state) => state.options)
  const resolve = useConfirmStore((state) => state.resolve)

  const {
    title = 'Ishonchingiz komilmi?',
    description = "Bu amalni bekor qilishning imkoni yo'q.",
    confirmLabel = "O'chirish",
    cancelLabel = 'Bekor qilish',
    tone = 'danger',
  } = options

  return (
    <Modal
      open={open}
      onClose={() => resolve(false)}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => resolve(false)}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => resolve(true)}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center px-1 py-2 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
        <div className="mb-3 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400 sm:mb-0">
          <HiOutlineExclamationTriangle className="size-6" />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--text)]">{title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>
        </div>
      </div>
    </Modal>
  )
}
