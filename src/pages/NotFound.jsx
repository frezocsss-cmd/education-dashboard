import { Link } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineHome } from 'react-icons/hi2'
import { LogoMark } from '@/components/layout/Brand'
import { ROUTES } from '@/routes/paths'

export default function NotFound() {
  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <LogoMark size="lg" />
      <p className="mt-8 text-[68px] leading-none font-extrabold tracking-[-0.06em] text-[var(--text)] sm:text-[96px]">
        4<span className="bg-gradient-to-br from-brand-500 to-indigo-700 bg-clip-text text-transparent">0</span>4
      </p>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--text)]">
        Sahifa topilmadi
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Siz izlagan sahifa o'chirilgan, manzili o'zgargan yoki hech qachon mavjud bo'lmagan.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Link to={ROUTES.dashboard} className="btn btn-primary">
          <HiOutlineHome className="size-4" />
          Boshqaruv paneli
        </Link>
        <button type="button" onClick={() => window.history.back()} className="btn btn-secondary">
          <HiOutlineArrowLeft className="size-4" />
          Orqaga qaytish
        </button>
      </div>
    </div>
  )
}
