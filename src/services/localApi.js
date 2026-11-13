import seedData from '../../db.json'

/**
 * Statik hosting (Vercel, Netlify, GitHub Pages) uchun demo backend.
 *
 * JSON Server mavjud bo'lmaganda ma'lumotlar brauzerdagi localStorage'ga yoziladi.
 * Boshlang'ich qiymatlar `db.json` faylidan olinadi, shuning uchun barcha
 * sahifalar, statistika va CRUD amallari to'liq ishlaydi.
 */
const STORAGE_KEY = 'nexus-demo-db-v1'

let cache = null

function clone(value) {
  if (value === undefined || value === null) return value
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* localStorage mavjud bo'lmasa, sessiya davomida xotirada ishlaydi */
  }
}

export function resetLocalData() {
  cache = clone(seedData)
  persist()
}

function database() {
  if (!cache) cache = loadFromStorage() || clone(seedData)
  return cache
}

function collection(resource) {
  const store = database()
  if (!Array.isArray(store[resource])) store[resource] = []
  return store[resource]
}

function httpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function matchesFilters(record, params) {
  return Object.entries(params).every(([key, value]) => {
    if (key.startsWith('_')) return true
    if (value === undefined || value === null || value === '') return true
    const recordValue = record[key]
    if (Array.isArray(recordValue)) {
      const values = Array.isArray(value) ? value : [value]
      return values.every((item) => recordValue.map(String).includes(String(item)))
    }
    if (Array.isArray(value)) return value.map(String).includes(String(recordValue))
    return String(recordValue) === String(value)
  })
}

function applySort(rows, params) {
  const sortKey = params._sort
  if (!sortKey) return rows
  const keys = Array.isArray(sortKey) ? sortKey : String(sortKey).split(',')
  const orders = String(params._order || 'asc')
    .split(',')
    .map((value) => value.trim().toLowerCase())

  return [...rows].sort((a, b) => {
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index].trim()
      const direction = orders[index] === 'desc' ? -1 : 1
      const first = a[key]
      const second = b[key]
      if (first === second) continue
      if (first === undefined || first === null) return 1
      if (second === undefined || second === null) return -1
      return String(first).localeCompare(String(second), 'uz', { numeric: true }) * direction
    }
    return 0
  })
}

function applyPagination(rows, params) {
  const page = Number(params._page)
  const limit = Number(params._limit)
  if (!limit || limit < 1) return rows
  const current = Number.isFinite(page) && page > 0 ? page : 1
  return rows.slice((current - 1) * limit, current * limit)
}

function findIndex(resource, id) {
  return collection(resource).findIndex((item) => String(item.id) === String(id))
}

export const localBackend = {
  list(resource, params = {}) {
    const rows = collection(resource).filter((record) => matchesFilters(record, params))
    return clone(applyPagination(applySort(rows, params), params))
  },

  get(resource, id) {
    if (resource === 'settings') {
      const settings = database().settings
      if (!settings) throw httpError('Yozuv topilmadi', 404)
      return clone(settings)
    }
    const index = findIndex(resource, id)
    if (index === -1) throw httpError('Yozuv topilmadi', 404)
    return clone(collection(resource)[index])
  },

  create(resource, data = {}) {
    const rows = collection(resource)
    const nextId = rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    const record = { ...clone(data), id: data?.id ?? nextId }
    rows.push(record)
    persist()
    return clone(record)
  },

  update(resource, id, data = {}) {
    if (resource === 'settings') {
      const record = { ...clone(data), id: 1 }
      database().settings = record
      persist()
      return clone(record)
    }
    const index = findIndex(resource, id)
    if (index === -1) throw httpError('Yozuv topilmadi', 404)
    const rows = collection(resource)
    rows[index] = { ...clone(data), id: rows[index].id }
    persist()
    return clone(rows[index])
  },

  patch(resource, id, data = {}) {
    if (resource === 'settings') {
      const record = { ...(database().settings || {}), ...clone(data), id: 1 }
      database().settings = record
      persist()
      return clone(record)
    }
    const index = findIndex(resource, id)
    if (index === -1) throw httpError('Yozuv topilmadi', 404)
    const rows = collection(resource)
    rows[index] = { ...rows[index], ...clone(data), id: rows[index].id }
    persist()
    return clone(rows[index])
  },

  remove(resource, id) {
    const index = findIndex(resource, id)
    if (index === -1) throw httpError('Yozuv topilmadi', 404)
    const rows = collection(resource)
    const [removed] = rows.splice(index, 1)
    persist()
    return clone(removed)
  },
}
