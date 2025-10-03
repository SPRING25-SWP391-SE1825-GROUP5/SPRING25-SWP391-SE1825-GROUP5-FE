import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import type { ReactElement } from 'react'

export default function RequireAuth({ children }: { children: ReactElement }) {
  const { token } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (!token) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return children
}

