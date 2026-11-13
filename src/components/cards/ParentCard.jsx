import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineArrowRight,
  HiOutlineEllipsisHorizontal,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineTrash,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import Avatar from '@/components/common/Avatar'
import Dropdown, { DropdownItem } from '@/components/common/Dropdown'
import { formatPhone } from '@/utils/format'
import { fullName } from '@/utils/stats'
import { ROUTES } from '@/routes/paths'

function ParentCard({ parent, linkedChildren = [], onEdit, onDelete }) {
  const navigate = useNavigate()
  const name = fullName(parent)
  const open = () => navigate(ROUTES.parent(parent.id))

  function handleKey(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKey}
      aria-label={`${name} profili`}
      className="card group relative cursor-pointer overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 dark:hover:border-brand-400/30"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start gap-3">
        <Avatar firstName={parent.firstName} lastName={parent.lastName} size="lg" ring />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[14.5px] font-bold tracking-[-0.02em] text-[var(--text)]">
            {name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted">
            <HiOutlinePhone className="size-3 shrink-0" />
            {formatPhone(parent.phone)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="chip">
              <HiOutlineUserGroup className="size-3" />
              {linkedChildren.length} farzand
            </span>
            {parent.email && (
              <span className="chip max-w-[150px]">
                <HiOutlineEnvelope className="size-3 shrink-0" />
                <span className="truncate">{parent.email}</span>
              </span>
            )}
          </div>
        </div>
        <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <Dropdown
            trigger={
              <button type="button" className="icon-btn icon-btn-sm" aria-label={`${name} uchun amallar`}>
                <HiOutlineEllipsisHorizontal className="size-5" />
              </button>
            }
            panelClassName="w-44"
          >
            {({ close }) => (
              <>
                <DropdownItem
                  icon={HiOutlineEye}
                  onClick={() => {
                    close()
                    open()
                  }}
                >
                  Batafsil
                </DropdownItem>
                <DropdownItem
                  icon={HiOutlinePencilSquare}
                  onClick={() => {
                    close()
                    onEdit(parent)
                  }}
                >
                  Tahrirlash
                </DropdownItem>
                <DropdownItem
                  icon={HiOutlineTrash}
                  danger
                  onClick={() => {
                    close()
                    onDelete(parent)
                  }}
                >
                  O'chirish
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
          <HiOutlineMapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--text-3)]" />
          <span className="line-clamp-2">{parent.address || 'Manzil kiritilmagan'}</span>
        </p>
      </div>

      <div className="relative mt-3">
        <p className="text-[9px] font-bold tracking-[0.08em] text-subtle uppercase">Farzandlari</p>
        {linkedChildren.length === 0 ? (
          <p className="mt-1 text-[11.5px] text-subtle">Hozircha o'quvchi bog'lanmagan</p>
        ) : (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {linkedChildren.slice(0, 3).map((child) => (
              <span key={child.id} className="chip !py-0.5 !text-[10px]">
                {fullName(child)}
              </span>
            ))}
            {linkedChildren.length > 3 && (
              <span className="chip !py-0.5 !text-[10px]">+{linkedChildren.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-[10px] font-medium text-subtle">ID #{parent.id}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-300">
          Batafsil
          <HiOutlineArrowRight className="size-3.5" />
        </span>
      </div>
    </article>
  )
}

export default memo(ParentCard)
