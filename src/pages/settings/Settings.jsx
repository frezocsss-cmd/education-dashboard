import { useEffect, useState } from 'react'
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineCheck,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineIdentification,
  HiOutlineLockClosed,
  HiOutlineMoon,
  HiOutlinePaintBrush,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineSun,
  HiOutlineUser,
} from 'react-icons/hi2'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Avatar from '@/components/common/Avatar'
import { SectionCard } from '@/components/common/SectionCard'
import { DetailSkeleton } from '@/components/common/Skeleton'
import { Field, FormGrid, Input } from '@/components/common/FormControls'
import { useAuth } from '@/hooks/useAuth'
import { useRecord, useForm } from '@/hooks/useApi'
import { useThemeStore } from '@/store/themeStore'
import { api } from '@/services/api'
import { toast } from '@/store/toastStore'
import { confirm } from '@/store/confirmStore'
import { AUTH_CONFIG } from '@/config/auth'
import { isEmail, isPhone, minLength, required, validateFields } from '@/utils/validation'
import { formatDate, formatPhone } from '@/utils/format'
import { cn } from '@/utils/cn'

const TABS = [
  { key: 'profile', label: 'Profil', icon: HiOutlineUser },
  { key: 'security', label: 'Xavfsizlik', icon: HiOutlineShieldCheck },
  { key: 'center', label: "Markaz ma'lumotlari", icon: HiOutlineBuildingOffice2 },
  { key: 'appearance', label: "Ko'rinish", icon: HiOutlinePaintBrush },
]

const CENTER_DEFAULT = {
  centerName: '',
  phone: '',
  email: '',
  address: '',
  workingHours: '',
  telegram: '',
  instagram: '',
}

export default function Settings() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const { theme, setTheme } = useThemeStore()
  const { data: settings, loading: settingsLoading, reload } = useRecord('settings', 1)

  const [tab, setTab] = useState('profile')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingCenter, setSavingCenter] = useState(false)
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false })

  const profileForm = useForm({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  })

  const passwordForm = useForm({ current: '', next: '', confirm: '' })

  const centerForm = useForm(CENTER_DEFAULT)

  useEffect(() => {
    if (settings) {
      centerForm.reset({
        centerName: settings.centerName || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        workingHours: settings.workingHours || '',
        telegram: settings.telegram || '',
        instagram: settings.instagram || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  async function handleProfileSubmit(event) {
    event.preventDefault()
    const errors = validateFields(profileForm.values, {
      firstName: [(value) => required(value, 'Ism kiritilishi shart')],
      lastName: [(value) => required(value, 'Familiya kiritilishi shart')],
      email: [(value) => isEmail(value, { optional: false })],
    })
    if (Object.keys(errors).length) {
      profileForm.setErrors(errors)
      return
    }
    setSavingProfile(true)
    try {
      const firstName = profileForm.values.firstName.trim()
      const lastName = profileForm.values.lastName.trim()
      updateProfile({
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: profileForm.values.email.trim().toLowerCase(),
      })
      toast.success('Profil yangilandi', "Ma'lumotlaringiz saqlandi")
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    const errors = validateFields(passwordForm.values, {
      current: [(value) => required(value, 'Joriy parolni kiriting')],
      next: [
        (value) =>
          minLength(
            value,
            AUTH_CONFIG.minPasswordLength,
            `Yangi parol kamida ${AUTH_CONFIG.minPasswordLength} ta belgidan iborat bo'lishi kerak`,
          ),
        (value) =>
          value && value === passwordForm.values.current
            ? 'Yangi parol joriy parol bilan bir xil bo‘lmasligi kerak'
            : '',
      ],
      confirm: [
        (value) => required(value, 'Yangi parolni tasdiqlang'),
        (value) => (value !== passwordForm.values.next ? 'Parollar mos kelmadi' : ''),
      ],
    })
    if (Object.keys(errors).length) {
      passwordForm.setErrors(errors)
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(passwordForm.values.current, passwordForm.values.next)
      passwordForm.reset({ current: '', next: '', confirm: '' })
      toast.success("Parol o'zgartirildi", 'Keyingi kirishda yangi paroldan foydalaning')
    } catch (err) {
      toast.error('Parolni o‘zgartirishda xatolik', err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleCenterSubmit(event) {
    event.preventDefault()
    const errors = validateFields(centerForm.values, {
      centerName: [(value) => required(value, 'Markaz nomini kiriting')],
      phone: [isPhone],
      email: [(value) => isEmail(value, { optional: false })],
      address: [(value) => required(value, 'Manzilni kiriting')],
      workingHours: [(value) => required(value, 'Ish vaqtini kiriting')],
    })
    if (Object.keys(errors).length) {
      centerForm.setErrors(errors)
      return
    }
    setSavingCenter(true)
    try {
      await api.update('settings', 1, {
        ...settings,
        ...centerForm.values,
        centerName: centerForm.values.centerName.trim(),
        phone: centerForm.values.phone.trim(),
        email: centerForm.values.email.trim().toLowerCase(),
        address: centerForm.values.address.trim(),
        workingHours: centerForm.values.workingHours.trim(),
        telegram: centerForm.values.telegram.trim(),
        instagram: centerForm.values.instagram.trim(),
        id: 1,
        updatedAt: new Date().toISOString().slice(0, 10),
      })
      toast.success("Markaz ma'lumotlari saqlandi", centerForm.values.centerName)
      reload()
    } catch (err) {
      toast.error('Saqlashda xatolik', err.message)
    } finally {
      setSavingCenter(false)
    }
  }

  async function handleLogout() {
    const approved = await confirm({
      title: 'Tizimdan chiqish',
      description: 'Hisobingizdan chiqmoqchimisiz? Qayta kirish uchun telefon va parol kerak bo‘ladi.',
      confirmLabel: 'Chiqish',
      tone: 'danger',
    })
    if (!approved) return
    await logout()
  }

  function toggleShow(field) {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || '—'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sozlamalar"
        description="Profil, xavfsizlik, markaz ma'lumotlari va interfeys ko'rinishi."
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="card h-fit p-2">
          <div className="hidden items-center gap-3 px-3 py-3 lg:flex">
            <Avatar firstName={user?.firstName} lastName={user?.lastName} size="md" ring />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-bold text-[var(--text)]">{fullName}</p>
              <p className="truncate text-[10px] text-subtle">{user?.role || 'Administrator'}</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:mt-1 lg:flex-col lg:border-t lg:border-[var(--border)] lg:pt-2">
            {TABS.map((item) => {
              const Icon = item.icon
              const active = tab === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 lg:mt-2 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <HiOutlineArrowRightOnRectangle className="size-4 shrink-0" />
              Tizimdan chiqish
            </button>
          </nav>
        </div>

        <div className="min-w-0 space-y-4">
          {tab === 'profile' && (
            <SectionCard
              title="Profil ma'lumotlari"
              description="Administrator hisobining shaxsiy ma'lumotlari."
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <HiOutlineIdentification className="size-4" />
                </span>
              }
            >
              <div className="mb-5 flex flex-col items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:flex-row sm:items-center">
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  src={user?.avatar}
                  size="xl"
                  ring
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-[var(--text)]">{fullName}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{user?.role || 'Administrator'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="chip">
                      <HiOutlinePhone className="size-3" />
                      {formatPhone(user?.phone)}
                    </span>
                    <span className="chip">
                      <HiOutlineShieldCheck className="size-3" />
                      Demo hisob
                    </span>
                  </div>
                </div>
              </div>

              <form id="profile-form" onSubmit={handleProfileSubmit} noValidate className="space-y-5">
                <FormGrid>
                  <Field
                    label="Ism"
                    htmlFor="profileFirstName"
                    error={profileForm.errors.firstName}
                    required
                  >
                    <Input
                      id="profileFirstName"
                      value={profileForm.values.firstName}
                      onChange={(event) => profileForm.setField('firstName', event.target.value)}
                      error={Boolean(profileForm.errors.firstName)}
                    />
                  </Field>
                  <Field
                    label="Familiya"
                    htmlFor="profileLastName"
                    error={profileForm.errors.lastName}
                    required
                  >
                    <Input
                      id="profileLastName"
                      value={profileForm.values.lastName}
                      onChange={(event) => profileForm.setField('lastName', event.target.value)}
                      error={Boolean(profileForm.errors.lastName)}
                    />
                  </Field>
                  <Field
                    label="Email"
                    htmlFor="profileEmail"
                    error={profileForm.errors.email}
                    required
                  >
                    <Input
                      id="profileEmail"
                      type="email"
                      icon={HiOutlineEnvelope}
                      value={profileForm.values.email}
                      onChange={(event) => profileForm.setField('email', event.target.value)}
                      error={Boolean(profileForm.errors.email)}
                    />
                  </Field>
                  <Field
                    label="Telefon raqam"
                    htmlFor="profilePhone"
                    hint="Demo hisob telefoni o'zgartirilmaydi"
                  >
                    <Input
                      id="profilePhone"
                      value={formatPhone(user?.phone)}
                      readOnly
                      className="cursor-not-allowed opacity-70"
                    />
                  </Field>
                </FormGrid>
                <div className="flex justify-end border-t border-[var(--border)] pt-4">
                  <Button type="submit" variant="primary" loading={savingProfile} icon={HiOutlineCheck}>
                    Profilni saqlash
                  </Button>
                </div>
              </form>
            </SectionCard>
          )}

          {tab === 'security' && (
            <>
              <SectionCard
                title="Parolni o'zgartirish"
                description="Xavfsizlik uchun kamida 8 ta belgidan iborat parol tanlang."
                action={
                  <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                    <HiOutlineLockClosed className="size-4" />
                  </span>
                }
              >
                <form
                  id="password-form"
                  onSubmit={handlePasswordSubmit}
                  noValidate
                  className="space-y-5"
                >
                  <Field
                    label="Joriy parol"
                    htmlFor="currentPassword"
                    error={passwordForm.errors.current}
                    required
                  >
                    <Input
                      id="currentPassword"
                      type={showPassword.current ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={passwordForm.values.current}
                      onChange={(event) => passwordForm.setField('current', event.target.value)}
                      error={Boolean(passwordForm.errors.current)}
                      suffix={
                        <button
                          type="button"
                          onClick={() => toggleShow('current')}
                          className="icon-btn icon-btn-sm"
                          aria-label={showPassword.current ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                        >
                          {showPassword.current ? (
                            <HiOutlineEyeSlash className="size-4" />
                          ) : (
                            <HiOutlineEye className="size-4" />
                          )}
                        </button>
                      }
                    />
                  </Field>
                  <FormGrid>
                    <Field
                      label="Yangi parol"
                      htmlFor="newPassword"
                      error={passwordForm.errors.next}
                      hint="Kamida 8 ta belgi"
                      required
                    >
                      <Input
                        id="newPassword"
                        type={showPassword.next ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={passwordForm.values.next}
                        onChange={(event) => passwordForm.setField('next', event.target.value)}
                        error={Boolean(passwordForm.errors.next)}
                        suffix={
                          <button
                            type="button"
                            onClick={() => toggleShow('next')}
                            className="icon-btn icon-btn-sm"
                            aria-label={showPassword.next ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                          >
                            {showPassword.next ? (
                              <HiOutlineEyeSlash className="size-4" />
                            ) : (
                              <HiOutlineEye className="size-4" />
                            )}
                          </button>
                        }
                      />
                    </Field>
                    <Field
                      label="Yangi parolni tasdiqlang"
                      htmlFor="confirmPassword"
                      error={passwordForm.errors.confirm}
                      required
                    >
                      <Input
                        id="confirmPassword"
                        type={showPassword.confirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={passwordForm.values.confirm}
                        onChange={(event) => passwordForm.setField('confirm', event.target.value)}
                        error={Boolean(passwordForm.errors.confirm)}
                        suffix={
                          <button
                            type="button"
                            onClick={() => toggleShow('confirm')}
                            className="icon-btn icon-btn-sm"
                            aria-label={
                              showPassword.confirm ? 'Parolni yashirish' : "Parolni ko'rsatish"
                            }
                          >
                            {showPassword.confirm ? (
                              <HiOutlineEyeSlash className="size-4" />
                            ) : (
                              <HiOutlineEye className="size-4" />
                            )}
                          </button>
                        }
                      />
                    </Field>
                  </FormGrid>
                  <div className="flex justify-end border-t border-[var(--border)] pt-4">
                    <Button type="submit" variant="primary" loading={savingPassword}>
                      Parolni yangilash
                    </Button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard title="Seans" description="Joriy kirish seansi haqida ma'lumot">
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[12.5px] font-bold text-[var(--text)]">
                      Administrator seansi faol
                    </p>
                    <p className="mt-0.5 text-[11px] text-subtle">
                      Demo ma'lumotlari brauzer xotirasida saqlanadi. Umumiy joylashuvda foydalanmang.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleLogout}>
                    Tizimdan chiqish
                  </Button>
                </div>
              </SectionCard>
            </>
          )}

          {tab === 'center' && (
            <SectionCard
              title="O'quv markazi ma'lumotlari"
              description="Hisobotlar, cheklar va interfeysda foydalaniladigan markaz rekvizitlari."
              action={
                <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                  <HiOutlineBuildingOffice2 className="size-4" />
                </span>
              }
            >
              {settingsLoading ? (
                <DetailSkeleton />
              ) : (
                <form id="center-form" onSubmit={handleCenterSubmit} noValidate className="space-y-5">
                  <FormGrid>
                    <Field
                      label="Markaz nomi"
                      htmlFor="centerName"
                      error={centerForm.errors.centerName}
                      required
                      className="sm:col-span-2"
                    >
                      <Input
                        id="centerName"
                        value={centerForm.values.centerName}
                        onChange={(event) => centerForm.setField('centerName', event.target.value)}
                        error={Boolean(centerForm.errors.centerName)}
                      />
                    </Field>
                    <Field label="Telefon" htmlFor="centerPhone" error={centerForm.errors.phone} required>
                      <Input
                        id="centerPhone"
                        type="tel"
                        value={centerForm.values.phone}
                        onChange={(event) => centerForm.setField('phone', event.target.value)}
                        error={Boolean(centerForm.errors.phone)}
                      />
                    </Field>
                    <Field label="Email" htmlFor="centerEmail" error={centerForm.errors.email} required>
                      <Input
                        id="centerEmail"
                        type="email"
                        value={centerForm.values.email}
                        onChange={(event) => centerForm.setField('email', event.target.value)}
                        error={Boolean(centerForm.errors.email)}
                      />
                    </Field>
                    <Field
                      label="Manzil"
                      htmlFor="centerAddress"
                      error={centerForm.errors.address}
                      required
                      className="sm:col-span-2"
                    >
                      <Input
                        id="centerAddress"
                        value={centerForm.values.address}
                        onChange={(event) => centerForm.setField('address', event.target.value)}
                        error={Boolean(centerForm.errors.address)}
                      />
                    </Field>
                    <Field
                      label="Ish vaqti"
                      htmlFor="centerHours"
                      error={centerForm.errors.workingHours}
                      required
                    >
                      <Input
                        id="centerHours"
                        value={centerForm.values.workingHours}
                        onChange={(event) => centerForm.setField('workingHours', event.target.value)}
                        error={Boolean(centerForm.errors.workingHours)}
                      />
                    </Field>
                    <Field label="Telegram" htmlFor="centerTelegram">
                      <Input
                        id="centerTelegram"
                        placeholder="@nexusedu"
                        value={centerForm.values.telegram}
                        onChange={(event) => centerForm.setField('telegram', event.target.value)}
                      />
                    </Field>
                    <Field label="Instagram" htmlFor="centerInstagram">
                      <Input
                        id="centerInstagram"
                        placeholder="@nexus.education"
                        value={centerForm.values.instagram}
                        onChange={(event) => centerForm.setField('instagram', event.target.value)}
                      />
                    </Field>
                  </FormGrid>
                  <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10.5px] text-subtle">
                      Oxirgi yangilanish:{' '}
                      {settings?.updatedAt ? formatDate(settings.updatedAt) : '—'}
                    </p>
                    <Button type="submit" variant="primary" loading={savingCenter} icon={HiOutlineCheck}>
                      Saqlash
                    </Button>
                  </div>
                </form>
              )}
            </SectionCard>
          )}

          {tab === 'appearance' && (
            <>
              <SectionCard
                title="Mavzu"
                description="Interfeys ko'rinishini tanlang. Tanlov brauzerda saqlanadi."
                action={
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <HiOutlinePaintBrush className="size-4" />
                  </span>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'relative overflow-hidden rounded-2xl border-2 p-1 text-left transition-all',
                      theme === 'light'
                        ? 'border-brand-500 shadow-[0_0_0_3px_rgba(109,52,236,0.12)]'
                        : 'border-[var(--border)] hover:border-brand-300',
                    )}
                  >
                    <div className="rounded-xl bg-slate-100 p-3">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-8 rounded-full bg-slate-300" />
                        <div className="h-2 w-12 rounded-full bg-slate-200" />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <div className="h-14 w-10 rounded-lg bg-white shadow-sm" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-8 rounded-lg bg-white shadow-sm" />
                          <div className="h-5 rounded-lg bg-white/80" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text)]">
                        <HiOutlineSun className="size-4 text-amber-500" />
                        Yorug' rejim
                      </span>
                      {theme === 'light' && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                          <HiOutlineCheck className="size-3" />
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'relative overflow-hidden rounded-2xl border-2 p-1 text-left transition-all',
                      theme === 'dark'
                        ? 'border-brand-500 shadow-[0_0_0_3px_rgba(109,52,236,0.2)]'
                        : 'border-[var(--border)] hover:border-brand-300',
                    )}
                  >
                    <div className="rounded-xl bg-slate-900 p-3">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-8 rounded-full bg-slate-600" />
                        <div className="h-2 w-12 rounded-full bg-slate-700" />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <div className="h-14 w-10 rounded-lg bg-slate-800" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-8 rounded-lg bg-slate-800" />
                          <div className="h-5 rounded-lg bg-slate-800/70" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text)]">
                        <HiOutlineMoon className="size-4 text-indigo-400" />
                        Tungi rejim
                      </span>
                      {theme === 'dark' && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                          <HiOutlineCheck className="size-3" />
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                title="Tizim haqida"
                description="Demo loyiha ma'lumotlari"
                action={
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    <HiOutlineCog6Tooth className="size-4" />
                  </span>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] text-subtle uppercase">
                      <HiOutlineBanknotes className="size-3" />
                      Ilova
                    </p>
                    <p className="mt-1 text-[12.5px] font-bold text-[var(--text)]">
                      Nexus Education Admin
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-subtle">React + Vite + JSON Server</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] text-subtle uppercase">
                      <HiOutlineLockClosed className="size-3" />
                      Autentifikatsiya
                    </p>
                    <p className="mt-1 text-[12.5px] font-bold text-[var(--text)]">Demo (mock)</p>
                    <p className="mt-0.5 text-[10.5px] text-subtle">
                      Haqiqiy loyihada server tomonda tekshiriladi
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="danger" size="sm" onClick={handleLogout}>
                    Tizimdan chiqish
                  </Button>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
