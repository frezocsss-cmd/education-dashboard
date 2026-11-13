import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from '@/routes/AppRoutes'
import Toaster from '@/components/common/Toaster'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { initializeTheme } from '@/store/themeStore'

export default function App() {
  useEffect(() => {
    initializeTheme()
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
      <ConfirmDialog />
    </BrowserRouter>
  )
}
