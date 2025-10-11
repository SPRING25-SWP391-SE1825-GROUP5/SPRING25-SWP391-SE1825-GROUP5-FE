import { useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { AuthService } from '@/services/authService'
import EmailVerificationModal from './EmailVerificationModal'
import './EmailVerificationBanner.scss'

export default function EmailVerificationBanner() {
  const user = useAppSelector((s) => s.auth.user)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  // Chỉ hiển thị banner khi user chưa xác thực email
  if (!user || user.emailVerified) {
    return null
  }

  async function resend() {
    if (!user?.email || loading) return
    setLoading(true)
    setMessage(null)
    try {
      const resp = await AuthService.resendVerification(user.email)
      setMessage(resp?.message || 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại.'
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="email-verification-banner">
      <div className="email-verification-banner__container">
        <div className="email-verification-banner__left">
          <span className="email-verification-banner__icon">⚠️</span>
          <p className="email-verification-banner__msg">
            Tài khoản của bạn chưa được xác thực email. Hãy xác thực để bảo mật và sử dụng đầy đủ tính năng.
          </p>
        </div>
        <div className="email-verification-banner__actions">
          {message && <span className="email-verification-banner__hint">{message}</span>}
          <button 
            className="email-verification-banner__btn email-verification-banner__btn--secondary" 
            onClick={resend} 
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi lại email'}
          </button>
          <button 
            className="email-verification-banner__btn email-verification-banner__btn--primary" 
            onClick={() => setShowVerifyModal(true)}
          >
            Xác thực email
          </button>
        </div>
      </div>
      
      <EmailVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        userEmail={user?.email || ''}
      />
    </div>
  )
}


