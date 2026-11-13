export const LEVELS = ['Boshlang\'ich', "O'rta", 'Yuqori', 'IELTS']

export const LEVEL_DESCRIPTIONS = {
  "Boshlang'ich": '0 — A1',
  "O'rta": 'A2 — B1',
  Yuqori: 'B2 — C1',
  IELTS: '6.0+',
}

export const PAYMENT_STATUS = {
  paid: {
    label: "To'langan",
    short: "To'langan",
    tone: 'emerald',
  },
  partial: {
    label: 'Qisman',
    short: 'Qisman',
    tone: 'amber',
  },
  unpaid: {
    label: "To'lanmagan",
    short: "Qarz",
    tone: 'rose',
  },
}

export const ATTENDANCE_STATUS = {
  present: { label: 'Keldi', tone: 'emerald' },
  late: { label: 'Kechikdi', tone: 'amber' },
  absent: { label: 'Kelmadi', tone: 'rose' },
}

export const PERSON_STATUS = {
  active: { label: 'Faol', tone: 'emerald' },
  inactive: { label: "Nofaol", tone: 'slate' },
  vacation: { label: "Ta'tilda", tone: 'amber' },
}

export const GROUP_STATUS = {
  active: { label: 'Faol', tone: 'emerald' },
  planned: { label: 'Rejalashtirilgan', tone: 'sky' },
  finished: { label: 'Yakunlangan', tone: 'slate' },
}

export const PAYMENT_METHODS = {
  cash: { label: 'Naqd pul', icon: 'cash' },
  card: { label: 'Plastik karta', icon: 'card' },
  transfer: { label: "Bank o'tkazmasi", icon: 'transfer' },
  online: { label: 'Online', icon: 'online' },
}

export const WEEKDAYS = [
  { key: 'Du', label: 'Dushanba' },
  { key: 'Se', label: 'Seshanba' },
  { key: 'Ch', label: 'Chorshanba' },
  { key: 'Pa', label: 'Payshanba' },
  { key: 'Ju', label: 'Juma' },
  { key: 'Sh', label: 'Shanba' },
  { key: 'Ya', label: 'Yakshanba' },
]

export const WEEKDAY_SHORT = WEEKDAYS.reduce((acc, day) => {
  acc[day.key] = day.key
  return acc
}, {})

export const MONTHS_UZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
]

export const MONTHS_SHORT = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyn',
  'Iyl',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
]

export const COURSE_COLORS = [
  { value: 'violet', label: 'Binafsha' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'emerald', label: 'Yashil' },
  { value: 'sky', label: "Moviy" },
  { value: 'rose', label: 'Pushti' },
  { value: 'amber', label: 'Sariq' },
  { value: 'teal', label: "Feruza" },
  { value: 'orange', label: "To'q sariq" },
]

export const STUDENT_SORT_OPTIONS = [
  { value: 'newest', label: "Eng yangi qo'shilgan" },
  { value: 'name-asc', label: 'Ism (A → Z)' },
  { value: 'name-desc', label: 'Ism (Z → A)' },
  { value: 'level-asc', label: "Daraja (past → yuqori)" },
  { value: 'level-desc', label: 'Daraja (yuqori → past)' },
]

export const PAGE_SIZE = {
  students: 9,
  teachers: 9,
  employees: 8,
  parents: 9,
  payments: 10,
  groups: 9,
  courses: 9,
}
