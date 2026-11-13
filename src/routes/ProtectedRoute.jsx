import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from './paths'

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!user || !token) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  return children
}
