import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { logoutUser } from '@/store/authSlice'
import toast from 'react-hot-toast'

/**
 * Custom hook for handling user logout functionality
 * Provides logout function with API call, state cleanup, and navigation
 */
export const useLogout = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = useCallback(async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Đang đăng xuất...')
      
      // Dispatch logout action
      await dispatch(logoutUser()).unwrap()
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast)
      toast.success('Đăng xuất thành công!')
      
      // Navigate to login page
      navigate('/auth/login', { replace: true })
      
    } catch (error: any) {
      // Even if logout fails, user should still be logged out locally
      console.error('Logout error:', error)
      
      // Show error toast but still navigate
      toast.error('Có lỗi xảy ra khi đăng xuất, nhưng bạn đã được đăng xuất khỏi hệ thống')
      
      // Navigate to login page anyway
      navigate('/auth/login', { replace: true })
    }
  }, [dispatch, navigate])

  return {
    logout: handleLogout
  }
}
