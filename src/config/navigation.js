import {
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineBookOpen,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineHome,
  HiOutlineRectangleGroup,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi2'

export const navigation = [
  {
    label: 'Asosiy',
    items: [
      { to: '/', label: 'Boshqaruv paneli', icon: HiOutlineHome, end: true },
      { to: '/students', label: "O'quvchilar", icon: HiOutlineAcademicCap },
      { to: '/teachers', label: "O'qituvchilar", icon: HiOutlineUsers },
      { to: '/employees', label: 'Xodimlar', icon: HiOutlineBriefcase },
      { to: '/parents', label: 'Ota-onalar', icon: HiOutlineUserGroup },
    ],
  },
  {
    label: "Ta'lim",
    items: [
      { to: '/groups', label: 'Guruhlar', icon: HiOutlineRectangleGroup },
      { to: '/courses', label: 'Kurslar', icon: HiOutlineBookOpen },
      { to: '/attendance', label: 'Davomat', icon: HiOutlineCalendarDays },
    ],
  },
  {
    label: 'Moliya',
    items: [{ to: '/payments', label: "To'lovlar", icon: HiOutlineBanknotes }],
  },
  {
    label: 'Boshqaruv',
    items: [
      { to: '/reports', label: 'Hisobotlar', icon: HiOutlineChartBar },
      { to: '/settings', label: 'Sozlamalar', icon: HiOutlineCog6Tooth },
    ],
  },
]

export const pageMeta = {
  '/': { title: 'Boshqaruv paneli', breadcrumb: ['Boshqaruv paneli'] },
  '/students': { title: "O'quvchilar", breadcrumb: ["O'quvchilar"] },
  '/teachers': { title: "O'qituvchilar", breadcrumb: ["O'qituvchilar"] },
  '/employees': { title: 'Xodimlar', breadcrumb: ['Xodimlar'] },
  '/parents': { title: 'Ota-onalar', breadcrumb: ['Ota-onalar'] },
  '/groups': { title: 'Guruhlar', breadcrumb: ['Guruhlar'] },
  '/courses': { title: 'Kurslar', breadcrumb: ['Kurslar'] },
  '/attendance': { title: 'Davomat', breadcrumb: ['Davomat'] },
  '/payments': { title: "To'lovlar", breadcrumb: ["To'lovlar"] },
  '/reports': { title: 'Hisobotlar', breadcrumb: ['Hisobotlar'] },
  '/settings': { title: 'Sozlamalar', breadcrumb: ['Sozlamalar'] },
}

export const pageTitles = {
  students: "O'quvchi profili",
  teachers: "O'qituvchi profili",
  parents: 'Ota-ona profili',
  groups: 'Guruh tafsilotlari',
}
