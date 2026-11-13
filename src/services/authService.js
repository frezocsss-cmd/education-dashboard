import { AUTH_CONFIG, DEMO_ADMIN, DEMO_CREDENTIALS } from '@/config/auth'
import { normalizePhone } from '@/utils/format'

/**
 * Mock autentifikatsiya servisi.
 *
 * Real backendga o'tish uchun faqat shu fayldagi funksiyalarni API chaqiruvlari
 * bilan almashtirish kifoya (masalan POST /auth/login). UI va store qatlami
 * o'zgarmaydi.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function hashPassword(password) {
  const value = String(password)
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }
  // Zaxira variant (faqat eski brauzerlar uchun demo maqsadida).
  return btoa(unescape(encodeURIComponent(value)))
}

function readStored(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage mavjud emas */
  }
}

export function loadAdminProfile() {
  try {
    const raw = readStored(AUTH_CONFIG.profileKey)
    if (!raw) return { ...DEMO_ADMIN }
    const profile = JSON.parse(raw)
    return { ...DEMO_ADMIN, ...profile }
  } catch {
    return { ...DEMO_ADMIN }
  }
}

export function saveAdminProfile(profile) {
  writeStored(AUTH_CONFIG.profileKey, JSON.stringify(profile))
}

async function verifyPassword(password) {
  const storedHash = readStored(AUTH_CONFIG.passwordHashKey)
  if (storedHash) {
    const inputHash = await hashPassword(password)
    return inputHash === storedHash
  }
  return password === DEMO_CREDENTIALS.password
}

function createToken() {
  const random =
    globalThis.crypto?.randomUUID?.() ||
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return `nexus_${random.replace(/-/g, '')}`
}

export const authService = {
  async login({ phone, password, remember = true }) {
    await delay(650)
    const normalized = normalizePhone(phone)
    const demoPhone = normalizePhone(DEMO_CREDENTIALS.phone)

    if (!normalized || !password) {
      throw new Error('Telefon raqam va parolni kiriting')
    }
    if (normalized !== demoPhone) {
      throw new Error("Telefon raqam yoki parol noto'g'ri")
    }
    const isValid = await verifyPassword(password)
    if (!isValid) {
      throw new Error("Telefon raqam yoki parol noto'g'ri")
    }

    const profile = loadAdminProfile()
    const durationMs = remember
      ? AUTH_CONFIG.rememberDays * 24 * 60 * 60 * 1000
      : AUTH_CONFIG.sessionHours * 60 * 60 * 1000

    return {
      user: profile,
      token: createToken(),
      expiresAt: Date.now() + durationMs,
      remember,
    }
  },

  async changePassword(currentPassword, newPassword) {
    await delay(500)
    const isValid = await verifyPassword(currentPassword)
    if (!isValid) {
      throw new Error("Joriy parol noto'g'ri kiritilgan")
    }
    if (String(newPassword).length < AUTH_CONFIG.minPasswordLength) {
      throw new Error(`Yangi parol kamida ${AUTH_CONFIG.minPasswordLength} ta belgidan iborat bo'lishi kerak`)
    }
    const hash = await hashPassword(newPassword)
    writeStored(AUTH_CONFIG.passwordHashKey, hash)
    return true
  },

  updateProfile(profile) {
    saveAdminProfile(profile)
    return profile
  },

  async logout() {
    await delay(150)
    return true
  },
}
