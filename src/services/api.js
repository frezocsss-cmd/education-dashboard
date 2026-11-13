export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

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
  list(resource, params, signal) {
    return request(`/${resource}`, { params, signal })
  },
  get(resource, id, signal) {
    return request(`/${resource}/${id}`, { signal })
  },
  create(resource, data) {
    return request(`/${resource}`, { method: 'POST', body: data })
  },
  update(resource, id, data) {
    return request(`/${resource}/${id}`, { method: 'PUT', body: data })
  },
  patch(resource, id, data) {
    return request(`/${resource}/${id}`, { method: 'PATCH', body: data })
  },
  remove(resource, id) {
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
