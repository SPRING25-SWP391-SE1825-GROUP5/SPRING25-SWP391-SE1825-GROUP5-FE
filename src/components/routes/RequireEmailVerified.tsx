import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import type { ReactElement } from 'react'

/**
 * Component to protect routes that require email verification
 * Redirects to email verification page if user is not verified
 */
export default function RequireEmailVerified({ children }: { children: ReactElement }) {
  const { token, user } = useAppSelector((s) => s.auth)
  const location = useLocation()

  // If not logged in, redirect to login
  if (!token || !user) {
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  // If logged in but email not verified, redirect to email verification
  if (!user.emailVerified) {
    const emailParam = user.email ? `?email=${encodeURIComponent(user.email)}` : ''
    return <Navigate to={`/auth/verify-email${emailParam}`} replace />
  }

  // User is logged in and email is verified, allow access
  return children
}





