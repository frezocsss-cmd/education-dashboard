import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { ROUTES } from '@/routes/paths'

/**
 * Autentifikatsiya uchun yagona kirish nuqtasi.
 * Komponentlar store bilan bevosita ishlamaydi — shu hook orqali ishlaydi.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const loginAction = useAuthStore((state) => state.login)
  const logoutAction = useAuthStore((state) => state.logout)
  const updateProfileAction = useAuthStore((state) => state.updateProfile)
  const clearError = useAuthStore((state) => state.clearError)

  const navigate = useNavigate()
  const location = useLocation()

  const login = useCallback(
    async (credentials) => {
      const loggedUser = await loginAction(credentials)
      const from = location.state?.from?.pathname
      navigate(from && from !== ROUTES.login ? from : ROUTES.dashboard, { replace: true })
      return loggedUser
    },
    [loginAction, navigate, location.state],
  )

  const logout = useCallback(async () => {
    await authService.logout()
    logoutAction()
    navigate(ROUTES.login, { replace: true })
  }, [logoutAction, navigate])

  const updateProfile = useCallback(
    (patch) => updateProfileAction(patch),
    [updateProfileAction],
  )

  const changePassword = useCallback(
    (currentPassword, newPassword) => authService.changePassword(currentPassword, newPassword),
    [],
  )

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
  }
}
