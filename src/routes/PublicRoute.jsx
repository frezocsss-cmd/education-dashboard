import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from './paths'

export default function PublicRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (user && token) {
    const from = location.state?.from?.pathname
    return <Navigate to={from && from !== ROUTES.login ? from : ROUTES.dashboard} replace />
  }

  return children
}
