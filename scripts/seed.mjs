/**
 * Demo ma'lumotlar bazasini (db.json) generatsiya qiluvchi skript.
 * Ishga tushirish: node scripts/seed.mjs
 *
 * Barcha bog'lanishlar (student ↔ group ↔ course ↔ teacher ↔ parent) izchil.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let seedValue = 20261113
function random() {
  seedValue = (seedValue * 1664525 + 1013904223) % 4294967296
  return seedValue / 4294967296
}
function pick(list) {
  return list[Math.floor(random() * list.length)]
}
function chance(probability) {
  return random() < probability
}
function pad(number) {
  return String(number).padStart(2, '0')
}
function iso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
function monthKey(year, monthIndex) {
  return `${year}-${pad(monthIndex + 1)}`
}
function roundTo(value, step = 50000) {
  return Math.round(value / step) * step
}

const TODAY = new Date()
const YEAR = TODAY.getFullYear()
const MONTH = TODAY.getMonth()
const WEEKDAY_KEYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

// ---------------------------------------------------------------------------
// Kurslar
// ---------------------------------------------------------------------------
const courseSeed = [
  {
    name: 'Ingliz tili',
    description:
      "Umumiy ingliz tili dasturi: grammatika, so'zlashuv, tinglash va yozish ko'nikmalari bosqichma-bosqich rivojlantiriladi.",
    duration: 12,
    price: 600000,
    levels: 4,
    color: 'violet',
  },
  {
    name: 'IELTS Preparation',
    description:
      "Xalqaro IELTS imtihoniga intensiv tayyorgarlik. Mock imtihonlar, writing feedback va speaking practice.",
    duration: 4,
    price: 900000,
    levels: 3,
    color: 'indigo',
  },
  {
    name: 'Matematika',
    description:
      "Maktab dasturini mustahkamlash va mantiqiy fikrlashni rivojlantirish. Nazariya va amaliy masalalar uyg'unligi.",
    duration: 9,
    price: 500000,
    levels: 4,
    color: 'emerald',
  },
  {
    name: 'Frontend Dasturlash',
    description:
      "HTML, CSS, JavaScript va React asosida zamonaviy veb-ilovalar yaratishni o'rgatuvchi amaliy kurs.",
    duration: 12,
    price: 1200000,
    levels: 5,
    color: 'sky',
  },
  {
    name: 'Grafik dizayn',
    description:
      "Figma, Adobe Illustrator va Photoshop yordamida brending, SMM va UI dizayn asoslari.",
    duration: 8,
    price: 850000,
    levels: 3,
    color: 'rose',
  },
  {
    name: 'Rus tili',
    description:
      "Rus tilida erkin muloqot qilish va yozish ko'nikmalarini rivojlantiruvchi kompleks dastur.",
    duration: 10,
    price: 550000,
    levels: 4,
    color: 'amber',
  },
  {
    name: 'Kimyo',
    description:
      "Umumta'lim maktab kimyo dasturi asosida nazariy va laboratoriya mashg'ulotlari.",
    duration: 9,
    price: 500000,
    levels: 3,
    color: 'teal',
  },
  {
    name: 'IT Kids',
    description:
      "6–10 yoshli bolalar uchun robototexnika va dasturlash asoslari — o'yin orqali o'rganish.",
    duration: 6,
    price: 700000,
    levels: 2,
    color: 'orange',
  },
]

// ---------------------------------------------------------------------------
// O'qituvchilar
// ---------------------------------------------------------------------------
const teacherSeed = [
  ['Dilnoza', 'Rahimova', 'Ingliz tili', 7, 7000000, '2021-03-15', 'active'],
  ['Sardor', 'Yusupov', 'IELTS', 9, 8500000, '2020-09-01', 'active'],
  ['Nilufar', 'Abdullayeva', 'Matematika', 6, 6800000, '2022-01-10', 'active'],
  ['Jasur', 'Toshmatov', 'Frontend dasturlash', 5, 9000000, '2022-08-22', 'active'],
  ['Madina', 'Ismoilova', 'Grafik dizayn', 4, 7500000, '2023-02-06', 'active'],
  ['Otabek', 'Ergashev', 'Rus tili', 8, 6500000, '2021-11-18', 'active'],
  ['Zarina', 'Qodirova', 'Kimyo', 5, 6200000, '2022-09-05', 'vacation'],
  ['Bekzod', 'Sattorov', 'Robototexnika', 3, 5800000, '2023-06-12', 'active'],
  ['Kamola', 'Mirzayeva', 'Ingliz tili', 4, 6200000, '2023-01-23', 'active'],
  ['Temur', 'Xolmatov', 'Matematika', 10, 7800000, '2019-09-09', 'active'],
  ['Shahzoda', 'Sharipova', 'IELTS', 6, 7200000, '2022-04-04', 'active'],
  ['Ulug\u2019bek', 'Umarov', 'Frontend dasturlash', 3, 7000000, '2024-02-19', 'active'],
]

const specializations = ['Ingliz tili', 'IELTS']

const teachers = teacherSeed.map((item, index) => {
  const [firstName, lastName, specialization, experience, salary, joinDate, status] = item
  return {
    id: index + 1,
    firstName,
    lastName,
    phone: `+99890${String(1122334 + index * 137).padStart(7, '0')}`,
    email: `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName
      .toLowerCase()
      .replace(/[^a-z]/g, '')}@nexusedu.uz`,
    specialization,
    groupIds: [],
    experience,
    salary,
    joinDate,
    status,
    photo: '',
    notes: specializations.includes(specialization)
      ? "Xalqaro sertifikatga ega, speaking club rahbari."
      : '',
  }
})

// ---------------------------------------------------------------------------
// Guruhlar
// ---------------------------------------------------------------------------
const groupSeed = [
  ['ENG-A1-01', 1, 1, 'Du, Ch, Ju', '14:00 — 15:30', '101', -2, 'active', "Boshlang'ich"],
  ['ENG-A2-01', 1, 1, 'Du, Se, Pa', '16:00 — 17:30', '101', -2, 'active', "O'rta"],
  ['ENG-B1-01', 1, 9, 'Du, Ch, Ju', '10:00 — 11:30', '102', -3, 'active', 'Yuqori'],
  ['IELTS-INT', 2, 2, 'Se, Pa, Sh', '09:00 — 11:00', '201', -1, 'active', 'IELTS'],
  ['IELTS-EVE', 2, 11, 'Du, Se, Ch', '18:00 — 20:00', '202', -2, 'active', 'IELTS'],
  ['MATH-5', 3, 3, 'Du, Pa, Sh', '15:00 — 16:30', '103', -3, 'active', "O'rta"],
  ['FRONT-PRO', 4, 4, 'Du, Ch, Ju', '18:00 — 20:00', '301', -2, 'active', 'Yuqori'],
  ['DESIGN-01', 5, 5, 'Se, Pa, Sh', '14:00 — 16:00', '302', -1, 'active', "O'rta"],
  ['RUS-A2', 6, 6, 'Du, Ch', '11:00 — 12:30', '104', -4, 'active', "Boshlang'ich"],
  ['CHEM-01', 7, 7, 'Se, Pa', '15:00 — 16:30', '105', -2, 'active', "O'rta"],
  ['KIDS-IT', 8, 8, 'Sh', '10:00 — 12:00', '303', -1, 'active', "Boshlang'ich"],
  ['ENG-A1-02', 1, 9, 'Se, Pa, Sh', '10:00 — 11:30', '102', 1, 'planned', "Boshlang'ich"],
]

const groups = groupSeed.map((item, index) => {
  const [name, courseId, teacherId, days, time, room, monthOffset, status, level] = item
  const start = new Date(YEAR, MONTH + monthOffset, 2)
  return {
    id: index + 1,
    name,
    courseId,
    teacherId,
    studentIds: [],
    days,
    time,
    room,
    startDate: iso(start),
    status,
    level,
  }
})

groups.forEach((group) => {
  const teacher = teachers.find((item) => item.id === group.teacherId)
  if (teacher && !teacher.groupIds.includes(group.id)) teacher.groupIds.push(group.id)
})

// ---------------------------------------------------------------------------
// Ota-onalar
// ---------------------------------------------------------------------------
const parentSeed = [
  ['Rustam', 'Karimov', 'Yunusobod, 4-mavze, 12-uy'],
  ['Gulnora', 'Nazarova', 'Chilonzor, 9-mavze, 45-uy'],
  ['Bahodir', 'Toshmatov', 'Mirzo Ulug\u2019bek, Buyuk Ipak Yo\u2019li 88'],
  ['Feruza', 'Yusupova', 'Sergeli, 5-mavze, 18-uy'],
  ['Akmal', 'Rahimov', 'Yakkasaroy, Shota Rustaveli 22'],
  ['Nodira', 'Abdullayeva', 'Olmazor, Qorasaroy 7-uy'],
  ['Sherzod', 'Ismoilov', 'Bektemir, Oltintopgan 31'],
  ['Malika', 'Sattorova', 'Mirobod, Afrosiyob 14'],
  ['Davron', 'Ergashev', 'Yunusobod, 19-mavze, 3-uy'],
  ['Charos', 'Mirzayeva', 'Uchtepa, 2-mavze, 56-uy'],
  ['Bobur', 'Xolmatov', 'Shayxontohur, Labzak 9'],
  ['Zulfiya', 'Qodirova', 'Chilonzor, 19-mavze, 27-uy'],
  ['Islom', 'Sharipov', 'Mirzo Ulug\u2019bek, Mustaqillik 41'],
  ['Nilufar', 'Umarova', 'Yakkasaroy, Bobur 33'],
  ['Sanjar', 'Jalilov', 'Olmazor, Chustiy 12'],
  ['Aziza', 'Rashidova', 'Sergeli, Yangi Sergeli 5'],
  ['Temur', 'Nazarov', 'Yunusobod, 11-mavze, 62'],
  ['Mohinur', 'Karimova', 'Mirobod, Taras Shevchenko 8'],
  ['Otabek', 'Toshmatov', 'Bektemir, Bektemir 4'],
  ['Sevinch', 'Rahimova', 'Uchtepa, Qatortol 19'],
  ['Javohir', 'Abdullayev', 'Chilonzor, Bunyodkor 44'],
  ['Laylo', 'Ismoilova', 'Shayxontohur, Sebzor 16'],
  ['Farrux', 'Yusupov', 'Olmazor, Kichik halqa 77'],
  ['Munisa', 'Sattorova', 'Yunusobod, 6-mavze, 23'],
  ['Xurshid', 'Mirzayev', 'Sergeli, 12-mavze, 9'],
  ['Nozima', 'Ergasheva', 'Mirzo Ulug\u2019bek, Universitet 5'],
]

const parents = parentSeed.map((item, index) => {
  const [firstName, lastName, address] = item
  return {
    id: index + 1,
    firstName,
    lastName,
    phone: `+99893${String(2001122 + index * 311).padStart(7, '0')}`,
    email: `${firstName.toLowerCase()}.${lastName
      .toLowerCase()
      .replace(/[^a-z]/g, '')}${index + 1}@mail.uz`,
    address,
    studentIds: [],
    notes:
      index % 5 === 0
        ? "To'lovlarni har oyning 5-sanasigacha amalga oshiradi."
        : index % 7 === 0
          ? "Farzandining davomati yuzasidan alohida nazorat talab qiladi."
          : '',
  }
})

// ---------------------------------------------------------------------------
// O'quvchilar
// ---------------------------------------------------------------------------
const maleNames = [
  'Aziz', 'Jasur', 'Bekzod', 'Sardor', 'Islom', 'Temur', 'Otabek', 'Doston', 'Farrux',
  'Javohir', 'Bobur', 'Ulug\u2019bek', 'Rustam', 'Sanjar', 'Akmal', 'Davron', 'Sherzod',
  'Behruz', 'Xurshid', 'Mirjalol', 'Doniyor', 'Suhrob', 'Anvar', 'Ibrohim',
]
const femaleNames = [
  'Dilnoza', 'Madina', 'Shahzoda', 'Nilufar', 'Zulfiya', 'Malika', 'Sevinch', 'Gulnora',
  'Mohinur', 'Charos', 'Kamola', 'Nodira', 'Zarina', 'Ruxshona', 'Feruza', 'Munisa', 'Aziza',
  'Shodiya', 'Laylo', 'Nozima', 'Dildora', 'Maftuna', 'Sitora', 'Ziyoda',
]

function femaleLastName(lastName) {
  if (/v$/.test(lastName)) return `${lastName}a`
  if (/ov$/.test(lastName)) return `${lastName}a`
  return lastName
}

const studentNotes = [
  '',
  "Darslarga doimiy qatnashadi, matematikaga qiziqishi yuqori.",
  "Guruhda faol, lekin uy vazifalarini kechiktirib topshiradi.",
  "IELTS uchun speaking bo'yicha qo'shimcha mashg'ulot kerak.",
  "Ota-onasi bilan aloqa yaxshi yo'lga qo'yilgan.",
  "Kursni tugatgach xalqaro sertifikat olishni rejalashtirgan.",
  '',
  "Bir muddat kasallik sababli darslarni o'tkazib yubordi.",
]

const enrollableGroups = groups.filter((group) => group.studentIds.length === 0 && group.id <= 11)
const students = []
const allParents = parents

let studentIndex = 0
allParents.forEach((parent, parentIndex) => {
  const childCount = parentIndex % 4 === 0 ? 2 : 1
  // Umumiy o'quvchilar sonini 42 ga yaqinlashtirish uchun ba'zi ota-onalar 2 farzandli.
  const count = childCount
  for (let i = 0; i < count; i += 1) {
    if (studentIndex >= 42) break
    const group = enrollableGroups[studentIndex % enrollableGroups.length]
    const isFemale = chance(0.52)
    const firstName = isFemale ? pick(femaleNames) : pick(maleNames)
    const lastName = isFemale ? femaleLastName(parent.lastName) : parent.lastName
    const courseId = group.courseId

    // Qo'shilish sanasi: oxirgi 14 oy ichida, bosqichma-bosqich o'sish bilan.
    const monthOffset = Math.max(0, 13 - Math.floor(studentIndex / 3.2)) // 0..13
    const baseDate = new Date(YEAR, MONTH - monthOffset, 1)
    const maxDay =
      baseDate.getFullYear() === YEAR && baseDate.getMonth() === MONTH
        ? TODAY.getDate()
        : 27
    const day = 1 + Math.floor(random() * maxDay)
    const enrollmentDate = iso(new Date(baseDate.getFullYear(), baseDate.getMonth(), day))

    const student = {
      id: studentIndex + 1,
      firstName,
      lastName,
      phone: `+9989${pick(['0', '1', '3', '7', '8', '9'])}${String(
        3400011 + studentIndex * 977,
      ).padStart(7, '0')}`,
      parentId: parent.id,
      parentName: `${parent.firstName} ${parent.lastName}`,
      parentPhone: parent.phone,
      courseId,
      groupId: group.id,
      level: group.level,
      enrollmentDate,
      monthlyFee: 0,
      paymentStatus: 'paid',
      photo: '',
      notes: pick(studentNotes),
    }
    students.push(student)
    parent.studentIds.push(student.id)
    group.studentIds.push(student.id)
    studentIndex += 1
  }
})

// Qolganlarini to'ldirish (agar 42 ga yetmasa)
while (studentIndex < 42) {
  const parent = allParents[studentIndex % allParents.length]
  const group = enrollableGroups[studentIndex % enrollableGroups.length]
  const isFemale = chance(0.5)
  const firstName = isFemale ? pick(femaleNames) : pick(maleNames)
  const lastName = isFemale ? femaleLastName(parent.lastName) : parent.lastName
  const baseDate = new Date(YEAR, MONTH - 6, 1)
  const student = {
    id: studentIndex + 1,
    firstName,
    lastName,
    phone: `+9989${pick(['0', '1', '3', '7', '8', '9'])}${String(
      3400011 + studentIndex * 977,
    ).padStart(7, '0')}`,
    parentId: parent.id,
    parentName: `${parent.firstName} ${parent.lastName}`,
    parentPhone: parent.phone,
    courseId: group.courseId,
    groupId: group.id,
    level: group.level,
    enrollmentDate: iso(new Date(baseDate.getFullYear(), baseDate.getMonth(), 3)),
    monthlyFee: 0,
    paymentStatus: 'paid',
    photo: '',
    notes: '',
  }
  students.push(student)
  parent.studentIds.push(student.id)
  group.studentIds.push(student.id)
  studentIndex += 1
}

students.forEach((student) => {
  const course = courseSeed[student.courseId - 1]
  const discount = student.id % 9 === 0 ? 0.9 : 1
  student.monthlyFee = roundTo(course.price * discount, 50000)
})

// ---------------------------------------------------------------------------
// To'lovlar (oxirgi 6 oy)
// ---------------------------------------------------------------------------
const payments = []
const methods = ['cash', 'card', 'transfer', 'online']
let paymentId = 1

for (let offset = 5; offset >= 0; offset -= 1) {
  const monthDate = new Date(YEAR, MONTH - offset, 1)
  const key = monthKey(monthDate.getFullYear(), monthDate.getMonth())
  const isCurrent = offset === 0
  const isPast = offset > 0

  students.forEach((student) => {
    const roll = random()
    let status
    if (isPast) {
      status = roll < 0.85 ? 'paid' : roll < 0.93 ? 'partial' : 'unpaid'
    } else {
      status = roll < 0.58 ? 'paid' : roll < 0.74 ? 'partial' : 'unpaid'
    }

    const amount = student.monthlyFee
    let paidAmount = 0
    if (status === 'paid') paidAmount = amount
    if (status === 'partial') paidAmount = roundTo(amount * pick([0.4, 0.5, 0.6]), 50000)

    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
    let paymentDate = null
    if (status !== 'unpaid') {
      const maxDay = isCurrent ? TODAY.getDate() : lastDay
      const day = Math.min(maxDay, 2 + Math.floor(random() * 22))
      paymentDate = iso(new Date(monthDate.getFullYear(), monthDate.getMonth(), day))
    }

    payments.push({
      id: paymentId++,
      studentId: student.id,
      amount,
      paidAmount,
      month: key,
      date: paymentDate,
      status,
      method: status === 'unpaid' ? null : pick(methods),
      note:
        offset === 0 && status === 'partial'
          ? "Qolgan summa oy oxirigacha to'lanishi kelishilgan."
          : '',
    })

    if (isCurrent) student.paymentStatus = status
  })
}

// Ba'zi qo'shimcha to'lovlar (oldingi oylar uchun kechikkan to'lovlar)
;[7, 14, 21].forEach((studentId, index) => {
  const monthDate = new Date(YEAR, MONTH - (index + 1), 1)
  const key = monthKey(monthDate.getFullYear(), monthDate.getMonth())
  const student = students.find((item) => item.id === studentId)
  if (!student) return
  payments.push({
    id: paymentId++,
    studentId,
    amount: student.monthlyFee,
    paidAmount: student.monthlyFee,
    month: key,
    date: iso(new Date(monthDate.getFullYear(), monthDate.getMonth(), 18)),
    status: 'paid',
    method: 'card',
    note: "Qo'shimcha mashg'ulot to'lovi",
  })
})

// ---------------------------------------------------------------------------
// Davomat (oxirgi 4 hafta)
// ---------------------------------------------------------------------------
const attendance = []
let attendanceId = 1
const activeGroups = groups.filter((group) => group.status === 'active')

activeGroups.forEach((group) => {
  const groupStudents = students.filter((student) => student.groupId === group.id)
  if (!groupStudents.length) return
  const days = group.days.split(',').map((item) => item.trim())
  const sessions = []

  for (let back = 0; back <= 27 && sessions.length < 9; back += 1) {
    const date = new Date(YEAR, MONTH, TODAY.getDate() - back)
    if (!days.includes(WEEKDAY_KEYS[date.getDay()])) continue
    sessions.push(iso(date))
  }

  sessions.forEach((date) => {
    groupStudents.forEach((student) => {
      const roll = random()
      let status = 'present'
      if (roll > 0.9) status = 'absent'
      else if (roll > 0.82) status = 'late'
      attendance.push({
        id: attendanceId++,
        studentId: student.id,
        groupId: group.id,
        date,
        status,
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Xodimlar
// ---------------------------------------------------------------------------
const employeeSeed = [
  ['Zilola', 'Xudoyberdiyeva', 'Qabul bo\u2019limi menejeri', 5200000, '2022-05-10', '09:00 — 18:00', 'active'],
  ['Anvar', 'Sobirov', 'Buxgalter', 6800000, '2021-02-01', '09:00 — 18:00', 'active'],
  ['Dildora', 'Nematova', 'Marketing menejeri', 6100000, '2023-03-14', '10:00 — 19:00', 'active'],
  ['Sirojiddin', 'Hamidov', 'IT administrator', 7200000, '2022-11-21', '09:00 — 18:00', 'active'],
  ['Maftuna', 'Tursunova', 'Kotiba', 4200000, '2024-01-08', '09:00 — 17:00', 'active'],
  ['Elyor', 'Rasulov', 'Qo\u2019riqchi', 3500000, '2022-07-19', '18:00 — 06:00', 'active'],
  ['Nigora', 'Saidova', 'Tozalik xizmati', 3200000, '2023-09-04', '07:00 — 15:00', 'vacation'],
  ['Kamron', 'Xolmatov', 'Administrator yordamchisi', 4500000, '2024-06-03', '10:00 — 19:00', 'inactive'],
]

const employees = employeeSeed.map((item, index) => {
  const [firstName, lastName, position, salary, joinDate, schedule, status] = item
  return {
    id: index + 1,
    firstName,
    lastName,
    phone: `+99897${String(1005500 + index * 421).padStart(7, '0')}`,
    position,
    salary,
    joinDate,
    schedule,
    status,
    photo: '',
    notes: '',
  }
})

// ---------------------------------------------------------------------------
// Kurslar (o'qituvchilar ro'yxati bilan)
// ---------------------------------------------------------------------------
const courses = courseSeed.map((course, index) => {
  const courseId = index + 1
  const teacherIds = groups
    .filter((group) => group.courseId === courseId)
    .map((group) => group.teacherId)
  return {
    id: courseId,
    ...course,
    teacherIds: [...new Set(teacherIds)],
    createdAt: '2025-08-01',
  }
})

// ---------------------------------------------------------------------------
// Tadbirlar
// ---------------------------------------------------------------------------
function plusDays(days) {
  const date = new Date(YEAR, MONTH, TODAY.getDate() + days)
  return iso(date)
}

const events = [
  {
    id: 1,
    title: "Ota-onalar umumiy yig'ilishi",
    description: "Oylik natijalar, davomat va to'lovlar bo'yicha muhokama.",
    date: plusDays(4),
    time: '18:00',
    type: 'meeting',
    location: 'Katta konferens-zal',
  },
  {
    id: 2,
    title: 'IELTS mock imtihon',
    description: 'Listening, Reading, Writing va Speaking bo\'limlari bo\'yicha sinov imtihoni.',
    date: plusDays(8),
    time: '09:00',
    type: 'exam',
    location: '201-xona',
  },
  {
    id: 3,
    title: 'IT Kids yangi guruhi ochilishi',
    description: "6–10 yoshli bolalar uchun robototexnika guruhi. Bepul sinov darsi.",
    date: plusDays(13),
    time: '10:00',
    type: 'opening',
    location: '303-xona',
  },
  {
    id: 4,
    title: 'Ochiq eshiklar kuni',
    description: "Markaz faoliyati bilan tanishish va o'qituvchilar bilan suhbat.",
    date: plusDays(20),
    time: '11:00',
    type: 'event',
    location: 'Asosiy bino',
  },
  {
    id: 5,
    title: "Noyabr to'lovlarini yakunlash",
    description: "Joriy oy uchun to'lovlarni qabul qilishning oxirgi kuni.",
    date: plusDays(26),
    time: '18:00',
    type: 'payment',
    location: 'Qabul bo\u2019limi',
  },
]

// ---------------------------------------------------------------------------
// Bildirishnomalar
// ---------------------------------------------------------------------------
const notifications = [
  {
    id: 1,
    title: 'Yangi o\u2018quvchi qo\u2018shildi',
    message: 'Dilnoza Karimova IELTS Intensive guruhiga qabul qilindi.',
    type: 'student',
    date: new Date(YEAR, MONTH, TODAY.getDate(), 9, 12).toISOString(),
    read: false,
    link: '/students',
  },
  {
    id: 2,
    title: 'To\u2018lov eslatmasi',
    message: 'Joriy oy uchun 11 nafar o\u2018quvchida to\u2018lov qoldig\u2018i mavjud.',
    type: 'payment',
    date: new Date(YEAR, MONTH, TODAY.getDate() - 1, 16, 40).toISOString(),
    read: false,
    link: '/payments',
  },
  {
    id: 3,
    title: 'Ota-onalar yig\u2018ilishi',
    message: '4 kundan keyin umumiy ota-onalar yig\u2018ilishi bo\u2018lib o\u2018tadi.',
    type: 'event',
    date: new Date(YEAR, MONTH, TODAY.getDate() - 1, 10, 5).toISOString(),
    read: false,
    link: '/',
  },
  {
    id: 4,
    title: 'Yangi guruh rejalashtirildi',
    message: 'ENG-A1-02 guruhi uchun o\u2018quvchilar qabuli boshlandi.',
    type: 'group',
    date: new Date(YEAR, MONTH, TODAY.getDate() - 2, 14, 20).toISOString(),
    read: true,
    link: '/groups',
  },
  {
    id: 5,
    title: 'Davomat hisoboti tayyor',
    message: 'Oxirgi hafta bo\u2018yicha davomat hisoboti shakllantirildi.',
    type: 'attendance',
    date: new Date(YEAR, MONTH, TODAY.getDate() - 3, 8, 30).toISOString(),
    read: true,
    link: '/reports',
  },
  {
    id: 6,
    title: 'Tizimga muvaffaqiyatli kirdingiz',
    message: 'Nexus Education boshqaruv paneliga xush kelibsiz.',
    type: 'system',
    date: new Date(YEAR, MONTH, TODAY.getDate() - 4, 18, 0).toISOString(),
    read: true,
    link: '/',
  },
]

// ---------------------------------------------------------------------------
// Markaz sozlamalari
// ---------------------------------------------------------------------------
const settings = {
  id: 1,
  centerName: 'Nexus Education',
  phone: '+998 71 200 40 40',
  email: 'info@nexusedu.uz',
  address: 'Toshkent sh., Mirzo Ulug\u2019bek tumani, Buyuk Ipak Yo\u2019li 88',
  workingHours: 'Dushanba — Shanba, 08:00 — 20:00',
  telegram: '@nexusedu',
  instagram: '@nexus.education',
  updatedAt: iso(TODAY),
}

const db = {
  students,
  teachers,
  employees,
  parents,
  groups,
  courses,
  attendance,
  payments,
  notifications,
  events,
  settings,
}

writeFileSync(join(__dirname, '..', 'db.json'), `${JSON.stringify(db, null, 2)}\n`, 'utf8')

console.log(
  `db.json yaratildi: ${students.length} o'quvchi, ${teachers.length} o'qituvchi, ` +
    `${employees.length} xodim, ${parents.length} ota-ona, ${groups.length} guruh, ` +
    `${courses.length} kurs, ${attendance.length} davomat, ${payments.length} to'lov.`,
)
