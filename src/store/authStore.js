import { create } from 'zustand'
import { AUTH_CONFIG } from '@/config/auth'
import { authService } from '@/services/authService'

function readSession() {
  if (typeof window === 'undefined') return null
  const storages = [window.localStorage, window.sessionStorage]
  for (const storage of storages) {
    try {
      const raw = storage.getItem(AUTH_CONFIG.storageKey)
      if (!raw) continue
      const session = JSON.parse(raw)
      if (!session?.token || !session?.user) {
        storage.removeItem(AUTH_CONFIG.storageKey)
        continue
      }
      if (session.expiresAt && session.expiresAt < Date.now()) {
        storage.removeItem(AUTH_CONFIG.storageKey)
        continue
      }
      return session
    } catch {
      /* buzilgan yozuvni e'tiborsiz qoldiramiz */
    }
  }
  return null
}

function clearStoredSession() {
  try {
    window.localStorage.removeItem(AUTH_CONFIG.storageKey)
    window.sessionStorage.removeItem(AUTH_CONFIG.storageKey)
  } catch {
    /* storage mavjud emas */
  }
}

function persistSession(session) {
  const storage = session.remember ? window.localStorage : window.sessionStorage
  try {
    const other = session.remember ? window.sessionStorage : window.localStorage
    other.removeItem(AUTH_CONFIG.storageKey)
    storage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(session))
  } catch {
    /* storage mavjud emas */
  }
}

const initialSession = readSession()

export const useAuthStore = create((set, get) => ({
  user: initialSession?.user ?? null,
  token: initialSession?.token ?? null,
  expiresAt: initialSession?.expiresAt ?? null,
  remember: initialSession?.remember ?? true,
  loading: false,
  error: null,

  async login(credentials) {
    set({ loading: true, error: null })
    try {
      const session = await authService.login(credentials)
      persistSession(session)
      set({
        user: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
        remember: session.remember,
        loading: false,
        error: null,
      })
      return session.user
    } catch (error) {
      set({ loading: false, error: error.message || "Kirishda xatolik yuz berdi" })
      throw error
    }
  },

  logout() {
    clearStoredSession()
    set({ user: null, token: null, expiresAt: null, error: null })
  },

  updateProfile(patch) {
    const state = get()
    if (!state.user) return null
    const user = { ...state.user, ...patch }
    authService.updateProfile(user)
    if (state.token) {
      persistSession({
        user,
        token: state.token,
        expiresAt: state.expiresAt,
        remember: state.remember,
      })
    }
    set({ user })
    return user
  },

  clearError() {
    set({ error: null })
  },
}))
