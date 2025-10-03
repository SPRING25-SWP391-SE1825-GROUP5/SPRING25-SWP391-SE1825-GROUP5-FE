import { useEffect, useRef } from 'react'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'

// This component watches auth state and shows a one-time toast when user logs in
export default function LoginToastWatcher() {
  const { token, user, loading, error } = useAppSelector((s) => s.auth)
  const hasShownRef = useRef(false)

  useEffect(() => {
    // Avoid showing during pending or when error occurs
    if (loading || error) return

    const alreadyToasted = sessionStorage.getItem('loginToasted') === '1'

    if (token && user && !alreadyToasted && !hasShownRef.current) {
      hasShownRef.current = true
      sessionStorage.setItem('loginToasted', '1')
      toast.success(`Chào mừng ${user.fullName}! Đăng nhập thành công.`, {
        duration: 3000,
        position: 'top-right',
      })
    }
  }, [token, user, loading, error])

  return null
}

