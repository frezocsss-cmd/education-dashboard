export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'auto'

let backendPromise = null
let localBackendPromise = null

function getLocalBackend() {
  if (!localBackendPromise) {
    localBackendPromise = import('./localApi').then((module) => module.localBackend)
  }
  return localBackendPromise
}

/**
 * Qaysi backend ishlatilishini aniqlaydi:
 * - JSON Server mavjud bo'lsa — remote;
 * - statik hostingda API bo'lmasa — brauzerdagi demo backend.
 */
function detectBackend() {
  if (DATA_MODE === 'local') return getLocalBackend()
  if (DATA_MODE === 'remote') return Promise.resolve(null)
  if (!backendPromise) {
    backendPromise = (async () => {
      try {
        const canTimeout =
          typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        const response = await fetch(`${API_BASE_URL}/students`, {
          headers: { Accept: 'application/json' },
          signal: canTimeout ? AbortSignal.timeout(5000) : undefined,
        })
        if (!response.ok) return getLocalBackend()
        const payload = await response.json()
        return Array.isArray(payload) ? null : getLocalBackend()
      } catch {
        return getLocalBackend()
      }
    })()
  }
  return backendPromise
}

/** Joriy ma'lumot manbai: "remote" (JSON Server) yoki "local" (brauzer demo rejimi). */
export async function getBackendMode() {
  const backend = await detectBackend()
  return backend ? 'local' : 'remote'
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item))
    } else {
      search.set(key, String(value))
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const url = `${API_BASE_URL}${path}${buildQuery(params)}`
  let response

  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(
      "Ma'lumotlar bazasiga ulanib bo'lmadi. JSON Server ishlayotganini tekshiring (npm run server).",
      0,
    )
  }

  if (!response.ok) {
    let message = `So'rov bajarilmadi (${response.status})`
    try {
      const payload = await response.json()
      if (payload?.message) message = payload.message
    } catch {
      /* javob JSON emas */
    }
    if (response.status === 404) message = "Yozuv topilmadi yoki manzil noto'g'ri"
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError("Serverdan noto'g'ri javob qaytdi", response.status)
  }
}

export const api = {
  async list(resource, params, signal) {
    const local = await detectBackend()
    if (local) return local.list(resource, params)
    return request(`/${resource}`, { params, signal })
  },
  async get(resource, id, signal) {
    const local = await detectBackend()
    if (local) return local.get(resource, id)
    return request(`/${resource}/${id}`, { signal })
  },
  async create(resource, data) {
    const local = await detectBackend()
    if (local) return local.create(resource, data)
    return request(`/${resource}`, { method: 'POST', body: data })
  },
  async update(resource, id, data) {
    const local = await detectBackend()
    if (local) return local.update(resource, id, data)
    return request(`/${resource}/${id}`, { method: 'PUT', body: data })
  },
  async patch(resource, id, data) {
    const local = await detectBackend()
    if (local) return local.patch(resource, id, data)
    return request(`/${resource}/${id}`, { method: 'PATCH', body: data })
  },
  async remove(resource, id) {
    const local = await detectBackend()
    if (local) return local.remove(resource, id)
    return request(`/${resource}/${id}`, { method: 'DELETE' })
  },
}

/**
 * Bir nechta kolleksiyani parallel yuklash uchun qulay yordamchi.
 * Misol: fetchAll({ students: 'students', groups: 'groups' })
 */
export async function fetchAll(resourceMap, signal) {
  const keys = Object.keys(resourceMap)
  const results = await Promise.all(
    keys.map((key) => api.list(resourceMap[key], undefined, signal)),
  )
  return keys.reduce((acc, key, index) => {
    acc[key] = Array.isArray(results[index]) ? results[index] : []
    return acc
  }, {})
}
