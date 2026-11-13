/**
 * Demo administrator hisobi.
 *
 * DIQQAT: bu faqat demo (mock) autentifikatsiya. Haqiqiy ishlab chiqarish
 * muhitida parol tekshiruvi server tomonda (hash + JWT/session) bajarilishi shart.
 * `services/authService.js` dagi interfeys shu sababli alohida ajratilgan —
 * keyinchalik real API bilan almashtirish uchun faqat shu faylni o'zgartirish kifoya.
 */
export const DEMO_ADMIN = {
  id: 'admin-1',
  name: 'Aziz Karimov',
  firstName: 'Aziz',
  lastName: 'Karimov',
  phone: '+998901234567',
  email: 'admin@nexusedu.uz',
  role: 'Administrator',
  avatar: '',
}

export const DEMO_CREDENTIALS = {
  phone: '+998901234567',
  // Faqat demo uchun. Real loyihada hech qachon frontendda saqlanmaydi.
  password: 'Admin@2026',
}

export const AUTH_CONFIG = {
  storageKey: 'nexus-auth-session',
  profileKey: 'nexus-admin-profile',
  passwordHashKey: 'nexus-admin-password-hash',
  rememberDays: 7,
  sessionHours: 12,
  minPasswordLength: 8,
}

export const CENTER = {
  name: 'Nexus Education',
  tagline: "Bilim va kelajak bog'chasi",
  phone: '+998 71 200 40 40',
  email: 'info@nexusedu.uz',
  address: "Toshkent sh., Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li 88",
}
