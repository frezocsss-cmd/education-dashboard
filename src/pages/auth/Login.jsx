import { useEffect, useState } from 'react'
import { DEMO_CREDENTIALS } from '@/config/auth'
import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/store/themeStore'
import { toast } from '@/store/toastStore'
import { useForm } from '@/hooks/useApi'
import { isPhone, required, validateFields } from '@/utils/validation'
import { normalizePhone } from '@/utils/format'
import { Checkbox, Field, Input } from '@/components/common/FormControls'
import Button from '@/components/common/Button'
import Brand from '@/components/layout/Brand'
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlineMoon,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineSun,
} from 'react-icons/hi2'

const FEATURES = [
  "O'quvchilar, guruhlar va o'qituvchilarni yagona joydan boshqarish",
  "To'lovlar, qarzdorlik va oylik daromadni real vaqtda nazorat qilish",
  'Davomat va natijalar bo‘yicha aniq tahliliy hisobotlar',
]

export default function Login() {
  const { login, loading, error, clearError } = useAuth()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const { values, errors, setField, setErrors, setManyValues } = useForm({
    phone: '',
    password: '',
    remember: true,
  })

  useEffect(() => {
    clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(field, value) {
    setField(field, value)
    if (formError) setFormError('')
  }

  function fillDemo() {
    setManyValues({ phone: DEMO_CREDENTIALS.phone, password: DEMO_CREDENTIALS.password })
    setErrors({})
    setFormError('')
    toast.info('Demo ma’lumotlar to‘ldirildi', 'Endi “Kirish” tugmasini bosing.')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateFields(values, {
      phone: [isPhone],
      password: [(value) => required(value, 'Parolni kiriting')],
    })
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setFormError('')
    try {
      const user = await login({
        phone: normalizePhone(values.phone),
        password: values.password,
        remember: values.remember,
      })
      toast.success(
        `Xush kelibsiz, ${user.firstName}!`,
        "Boshqaruv paneliga muvaffaqiyatli kirdingiz.",
      )
    } catch (err) {
      setFormError(err.message || "Kirishda xatolik yuz berdi")
    }
  }

  const displayError = formError || error

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Brend paneli */}
      <div className="relative hidden w-[46%] max-w-[720px] overflow-hidden lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[linear-gradient(150deg,#140b2e_0%,#241052_45%,#3a1a7a_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(139,92,246,0.38),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(56,189,248,0.22),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div className="absolute top-1/3 -left-24 size-72 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <Brand size="lg" tone="light" />

          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[10.5px] font-semibold text-white/80 backdrop-blur">
              <HiOutlineSparkles className="size-3.5 text-amber-300" />
              Premium o‘quv markazi boshqaruvi
            </span>
            <h1 className="mt-5 text-[2.35rem] leading-[1.12] font-extrabold tracking-[-0.045em] text-white xl:text-[2.7rem]">
              Markazingizni
              <br />
              bitta paneldan
              <span className="bg-gradient-to-r from-brand-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                {' '}
                boshqaring.
              </span>
            </h1>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-white/55">
              O‘quvchilar, o‘qituvchilar, to‘lovlar va davomat — barchasi bir joyda. Tez,
              ishonchli va zamonaviy.
            </p>

            <ul className="mt-8 space-y-3.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25">
                    <HiOutlineCheckCircle className="size-3.5" />
                  </span>
                  <span className="text-[12.5px] leading-relaxed text-white/70">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
            <HiOutlineShieldCheck className="size-5 shrink-0 text-emerald-300" />
            <p className="text-[10.5px] leading-relaxed text-white/50">
              Demo tizim — ma’lumotlar JSON Server orqali saqlanadi. Haqiqiy loyihada
              autentifikatsiya server tomonda amalga oshiriladi.
            </p>
          </div>
        </div>
      </div>

      {/* Forma paneli */}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="lg:hidden">
            <Brand size="sm" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[11px] font-medium text-subtle sm:block">
              {theme === 'dark' ? 'Tungi rejim' : 'Kunduzgi rejim'}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn border border-[var(--border)] bg-[var(--surface)]"
              aria-label="Mavzuni almashtirish"
              title="Mavzuni almashtirish"
            >
              {theme === 'dark' ? (
                <HiOutlineSun className="size-4" />
              ) : (
                <HiOutlineMoon className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-[400px] animate-fade-up">
            <div className="mb-8">
              <p className="text-[10.5px] font-bold tracking-[0.18em] text-brand-600 uppercase dark:text-brand-300">
                Administrator kirishi
              </p>
              <h2 className="mt-2.5 text-[1.7rem] font-extrabold tracking-[-0.04em] text-[var(--text)] sm:text-[1.9rem]">
                Xush kelibsiz 👋
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Davom etish uchun hisobingizga kiring va markazingizni boshqarishni boshlang.
              </p>
            </div>

            {displayError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 dark:border-rose-500/20 dark:bg-rose-500/10"
              >
                <HiOutlineExclamationCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
                <p className="text-[12px] leading-relaxed font-medium text-rose-700 dark:text-rose-300">
                  {displayError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field label="Telefon raqam" htmlFor="phone" error={errors.phone} required>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+998 90 123 45 67"
                  value={values.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  error={Boolean(errors.phone)}
                  icon={HiOutlinePhone}
                />
              </Field>

              <Field label="Parol" htmlFor="password" error={errors.password} required>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  error={Boolean(errors.password)}
                  icon={HiOutlineLockClosed}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="flex size-7 items-center justify-center rounded-md text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                      aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <HiOutlineEyeSlash className="size-4" />
                      ) : (
                        <HiOutlineEye className="size-4" />
                      )}
                    </button>
                  }
                />
              </Field>

              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  label="Meni eslab qol"
                  checked={values.remember}
                  onChange={(event) => setField('remember', event.target.checked)}
                />
                <a
                  href="mailto:info@nexusedu.uz"
                  className="text-[11.5px] font-semibold text-brand-600 transition-opacity hover:opacity-75 dark:text-brand-300"
                >
                  Yordam kerakmi?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="mt-1 w-full"
                iconRight={HiOutlineArrowRight}
              >
                {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-[var(--text-2)] uppercase">
                    Demo hisob
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    Telefon:{' '}
                    <span className="font-semibold text-[var(--text)]">
                      {DEMO_CREDENTIALS.phone}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    Parol:{' '}
                    <span className="font-mono font-semibold text-[var(--text)]">
                      {DEMO_CREDENTIALS.password}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="btn btn-soft shrink-0 !px-3 !py-2 text-[11.5px]"
                >
                  To‘ldirish
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-[10px] leading-relaxed text-subtle">
              Kirish orqali siz markazning ichki foydalanish qoidalariga rozilik bildirasiz.
              <br />© {new Date().getFullYear()} Nexus Education
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
