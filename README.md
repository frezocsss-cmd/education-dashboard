# Nexus Education — O'quv markaz boshqaruv paneli

Zamonaviy o'quv markazi uchun to'liq funksional admin panel. Interfeys to'liq o'zbek tilida, yorug' va tungi mavzularni qo'llab-quvvatlaydi.

## Texnologiyalar

- **React 19** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router DOM 7** — himoyalangan marshrutlar
- **Zustand** — autentifikatsiya, mavzu, UI, toast va tasdiqlash oynalari
- **React Icons** (Heroicons 2)
- **JSON Server 0.17** — demo REST API
- Maxsus SVG diagrammalar (kutubxonasiz)

## Tez boshlash

```bash
# 1. Bog'liqliklarni o'rnatish
npm install

# 2. API (JSON Server) va frontendni birgalikda ishga tushirish
npm start
```

`npm start` buyrug'i ikkita jarayonni parallel ishga tushiradi:

| Jarayon | Manzil |
| --- | --- |
| API (JSON Server) | http://localhost:3001 |
| Ilova (Vite) | http://localhost:5173 |

Alohida ishga tushirish:

```bash
npm run server   # faqat API
npm run dev      # faqat frontend
```

## Demo hisob

| Maydon | Qiymat |
| --- | --- |
| Telefon | `+998901234567` |
| Parol | `Admin@2026` |

> **Diqqat:** autentifikatsiya demo maqsadida brauzerda (localStorage) amalga oshirilgan. Haqiqiy loyihada tekshiruv server tomonda, hash + JWT/session bilan bajarilishi kerak. Parol o'zgartirilganda faqat SHA-256 hash saqlanadi, ammo bu ham faqat demo uchun.

## Ma'lumotlar bazasi

Barcha demo ma'lumotlar `db.json` faylida saqlanadi. Qayta generatsiya qilish (barcha o'zgarishlar o'chib, boshlang'ich holat tiklanadi):

```bash
npm run seed
```

Seed skripti izchil bog'langan ma'lumotlarni yaratadi: o'quvchilar, o'qituvchilar, xodimlar, ota-onalar, guruhlar, kurslar, davomat, to'lovlar, tadbirlar va bildirishnomalar.

## Asosiy imkoniyatlar

- **Boshqaruv paneli** — barcha ko'rsatkichlar API ma'lumotlaridan real vaqtda hisoblanadi: o'quvchilar, o'qituvchilar, guruhlar, tushum, qarzdorlik, davomat dinamikasi.
- **O'quvchilar** — ro'yxat, qidiruv, filtr, saralash, sahifalash, profil, to'liq CRUD, guruh va ota-ona bilan bog'lash.
- **O'qituvchilar / Xodimlar** — CRUD, profil sahifalari, guruhlar bilan aloqalar.
- **Ota-onalar** — CRUD, farzandlari bilan bog'lanish, aloqa ma'lumotlari.
- **Guruhlar** — CRUD, o'quvchilarni guruhga biriktirish/ko'chirish, davomat va jadval.
- **Kurslar** — CRUD, narx va davomiylik, bog'langan guruhlar.
- **Davomat** — guruh va sana bo'yicha belgilash, statistika.
- **To'lovlar** — CRUD, oylik to'lovlar, qarzdorlik holati, o'quvchi balansi bilan sinxronizatsiya.
- **Hisobotlar** — moliyaviy va o'quv ko'rsatkichlari, CSV eksport.
- **Sozlamalar** — profil, parol, markaz ma'lumotlari, mavzu, tizimdan chiqish.

Qo'shimcha: global qidiruv (`Ctrl + K`), bildirishnomalar, toast xabarlar, tasdiqlash oynalari, yuklanish skeletlari, bo'sh holatlar va to'liq moslashuvchan (mobil drawer) dizayn.

## Loyiha tuzilishi

```
src/
├── components/
│   ├── charts/      # AreaChart, BarChart, DonutChart, HorizontalBars
│   ├── common/      # Button, Modal, FormControls, Toaster, ...
│   ├── layout/      # Sidebar, Topbar, GlobalSearch, DashboardLayout
│   └── forms/       # Entity formalari va kartalari
├── config/          # navigatsiya, demo hisob, konstantalar
├── hooks/           # useAuth, useApi, useForm, useClickOutside
├── pages/           # barcha sahifalar
├── routes/          # AppRoutes, ProtectedRoute, PublicRoute, paths
├── services/        # api.js, authService.js
├── store/           # Zustand store'lar
└── utils/           # format, stats, validation, relations, csv
```

## Foydali buyruqlar

| Buyruq | Tavsif |
| --- | --- |
| `npm start` | API + frontendni birgalikda ishga tushirish |
| `npm run dev` | Frontend (Vite) |
| `npm run server` | JSON Server API |
| `npm run seed` | `db.json` ni qayta generatsiya qilish |
| `npm run build` | Ishlab chiqarish uchun yig'ish |
| `npm run preview` | Yig'ilgan ilovani ko'rish |
| `npm run lint` | Oxlint tekshiruvi |

## Marshrutlar

| Yo'l | Sahifa |
| --- | --- |
| `/login` | Kirish |
| `/` | Boshqaruv paneli |
| `/students`, `/students/:id` | O'quvchilar va profil |
| `/teachers`, `/teachers/:id` | O'qituvchilar va profil |
| `/employees` | Xodimlar |
| `/parents`, `/parents/:id` | Ota-onalar va profil |
| `/groups`, `/groups/:id` | Guruhlar va tafsilotlar |
| `/courses` | Kurslar |
| `/attendance` | Davomat |
| `/payments` | To'lovlar |
| `/reports` | Hisobotlar |
| `/settings` | Sozlamalar |

## Muammolarni bartaraf etish

- **API javob bermayapti** — `npm run server` ishlayotganini va 3001-port band emasligini tekshiring.
- **Ma'lumotlar buzilgan** — `npm run seed` bilan bazani tiklang (serverni qayta ishga tushiring).
- **Kirish amalga oshmayapti** — demo telefon/parolni tekshiring yoki brauzer localStorage'idagi `nexus-auth-session` yozuvini tozalang.
