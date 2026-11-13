import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/services/api'

/**
 * REST kolleksiyasini yuklash uchun universal hook.
 * Barcha CRUD sahifalari shu hook orqali ma'lumot oladi va `reload()` bilan sinxronlaydi.
 */
export function useCollection(resource, params) {
  const paramsKey = JSON.stringify(params || {})
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)

    api
      .list(resource, JSON.parse(paramsKey), controller.signal)
      .then((result) => {
        if (!active) return
        setData(Array.isArray(result) ? result : [])
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setError(err.message || "Ma'lumotlarni yuklashda xatolik")
        setData([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [resource, paramsKey, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  return { data, loading, error, reload, setData }
}

/**
 * Bir nechta kolleksiyani parallel yuklaydi (dashboard, hisobotlar kabi sahifalar uchun).
 * `resourceMap` barqaror obyekt bo'lishi kerak — komponent tashqarisida e'lon qiling.
 */
export function useCollections(resourceMap) {
  const mapKey = JSON.stringify(resourceMap)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)

    const map = JSON.parse(mapKey)
    const keys = Object.keys(map)
    Promise.all(keys.map((key) => api.list(map[key], undefined, controller.signal)))
      .then((results) => {
        if (!active) return
        const next = {}
        keys.forEach((key, index) => {
          next[key] = Array.isArray(results[index]) ? results[index] : []
        })
        setData(next)
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setError(err.message || "Ma'lumotlarni yuklashda xatolik")
        setData({})
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [mapKey, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  return { data, loading, error, reload }
}

/**
 * Bitta yozuvni ID bo'yicha yuklaydi (profil sahifalari uchun).
 */
export function useRecord(resource, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setData(null)
      return undefined
    }
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)

    api
      .get(resource, id, controller.signal)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setError(err.status === 404 ? "Yozuv topilmadi" : err.message)
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [resource, id, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  return { data, loading, error, reload }
}

export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useClickOutside(onOutside) {
  const ref = useRef(null)
  useEffect(() => {
    function handle(event) {
      if (ref.current && !ref.current.contains(event.target)) onOutside(event)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [onOutside])
  return ref
}

/**
 * Formalar uchun yengil holat boshqaruvi: qiymatlar, xatolar va yuborish holati.
 */
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const initialRef = useRef(initialValues)

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const setManyValues = useCallback((patch) => {
    setValues((prev) => ({ ...prev, ...patch }))
  }, [])

  const reset = useCallback((nextValues) => {
    setValues(nextValues || initialRef.current)
    setErrors({})
  }, [])

  const validate = useCallback((validator) => {
    const nextErrors = validator(values) || {}
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [values])

  return useMemo(
    () => ({ values, errors, setField, setManyValues, setErrors, reset, validate, setValues }),
    [values, errors, setField, setManyValues, reset, validate],
  )
}
