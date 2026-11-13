import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set, get) => ({
  toasts: [],
  push(options) {
    const id = nextId++
    const duration = options.duration ?? 4200
    const payload = {
      id,
      type: options.type || 'info',
      title: options.title || '',
      description: options.description || '',
      duration,
    }
    set({ toasts: [...get().toasts, payload] })
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration)
    }
    return id
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((item) => item.id !== id) })
  },
  clear() {
    set({ toasts: [] })
  },
}))

export const toast = {
  success(title, description) {
    return useToastStore.getState().push({ type: 'success', title, description })
  },
  error(title, description) {
    return useToastStore.getState().push({ type: 'error', title, description, duration: 5500 })
  },
  info(title, description) {
    return useToastStore.getState().push({ type: 'info', title, description })
  },
  warning(title, description) {
    return useToastStore.getState().push({ type: 'warning', title, description, duration: 5000 })
  },
}
