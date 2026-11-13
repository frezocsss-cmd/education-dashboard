import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        const next = theme === 'dark' ? 'dark' : 'light'
        set({ theme: next })
        applyTheme(next)
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        applyTheme(next)
      },
    }),
    { name: 'nexus-theme' },
  ),
)

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const isDark = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function initializeTheme() {
  applyTheme(useThemeStore.getState().theme)
}
